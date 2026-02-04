import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../attendance/entities';
import { Meeting } from '../meetings/entities';
import { SontaHead, SontaHeadStatus } from '../sonta-heads/entities';
import { AnalyticsQueryDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(SontaHead)
    private sontaHeadRepository: Repository<SontaHead>,
  ) {}

  async getOverview(dto: AnalyticsQueryDto) {
    const whereClause: any = {};

    if (dto.startDate && dto.endDate) {
      whereClause.checkInTimestamp = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    const [
      totalMeetings,
      totalAttendance,
      totalSontaHeads,
      averageAttendanceRate,
    ] = await Promise.all([
      this.getMeetingsCount(dto),
      this.attendanceRepository.count({ where: whereClause }),
      this.sontaHeadRepository.count({ where: { status: SontaHeadStatus.ACTIVE } }),
      this.calculateAverageAttendanceRate(dto),
    ]);

    const lateArrivals = await this.attendanceRepository.count({
      where: { ...whereClause, isLate: true },
    });

    const manualCheckIns = await this.attendanceRepository.count({
      where: { ...whereClause, checkInMethod: 'manual_admin' },
    });

    return {
      totalMeetings,
      totalAttendance,
      totalSontaHeads,
      averageAttendanceRate: Math.round(averageAttendanceRate),
      lateArrivals,
      manualCheckIns,
      lateArrivalRate: totalAttendance > 0 ? (lateArrivals / totalAttendance) * 100 : 0,
      manualCheckInRate: totalAttendance > 0 ? (manualCheckIns / totalAttendance) * 100 : 0,
    };
  }

  async getSontaHeadAnalytics(sontaHeadId: string, dto: AnalyticsQueryDto) {
    const sontaHead = await this.sontaHeadRepository.findOne({
      where: { id: sontaHeadId },
    });

    if (!sontaHead) {
      throw new NotFoundException('Sonta Head not found');
    }

    const whereClause: any = { sontaHeadId };

    if (dto.startDate && dto.endDate) {
      whereClause.checkInTimestamp = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    const attendance = await this.attendanceRepository.find({
      where: whereClause,
      relations: ['meeting'],
      order: { checkInTimestamp: 'DESC' },
    });

    const totalMeetingsInPeriod = await this.getMeetingsCount(dto);
    const attendedCount = attendance.length;
    const lateCount = attendance.filter((a) => a.isLate).length;
    const onTimeCount = attendedCount - lateCount;

    return {
      sontaHead: {
        id: sontaHead.id,
        name: sontaHead.name,
        phone: sontaHead.phone,
        profileImageUrl: sontaHead.profileImageUrl,
      },
      statistics: {
        totalMeetings: totalMeetingsInPeriod,
        attended: attendedCount,
        missed: totalMeetingsInPeriod - attendedCount,
        attendanceRate: totalMeetingsInPeriod > 0 ? (attendedCount / totalMeetingsInPeriod) * 100 : 0,
        onTime: onTimeCount,
        late: lateCount,
        lateRate: attendedCount > 0 ? (lateCount / attendedCount) * 100 : 0,
      },
      recentAttendance: attendance.slice(0, 10).map((a) => ({
        id: a.id,
        meeting: {
          id: a.meeting.id,
          title: a.meeting.title,
          scheduledStart: a.meeting.scheduledStart,
        },
        checkInTimestamp: a.checkInTimestamp,
        isLate: a.isLate,
        facialConfidenceScore: a.facialConfidenceScore,
      })),
    };
  }

  async getMeetingAnalytics(meetingId: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    const attendance = await this.attendanceRepository.find({
      where: { meetingId },
      relations: ['sontaHead'],
      order: { checkInTimestamp: 'ASC' },
    });

    const expected = meeting.expectedAttendees || 0;
    const actual = attendance.length;
    const late = attendance.filter((a) => a.isLate).length;
    const manual = attendance.filter((a) => a.checkInMethod === 'manual_admin').length;

    // Calculate check-in timeline (by hour)
    const timeline = this.calculateCheckInTimeline(attendance, meeting);

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        scheduledStart: meeting.scheduledStart,
        scheduledEnd: meeting.scheduledEnd,
        actualStart: meeting.actualStart,
        actualEnd: meeting.actualEnd,
        status: meeting.status,
      },
      statistics: {
        expectedAttendees: expected,
        actualAttendees: actual,
        attendanceRate: expected > 0 ? (actual / expected) * 100 : 0,
        onTime: actual - late,
        late,
        lateRate: actual > 0 ? (late / actual) * 100 : 0,
        manualCheckIns: manual,
        facialRecognitionCheckIns: actual - manual,
      },
      timeline,
      attendance: attendance.map((a) => ({
        id: a.id,
        sontaHead: {
          id: a.sontaHead.id,
          name: a.sontaHead.name,
          phone: a.sontaHead.phone,
        },
        checkInTimestamp: a.checkInTimestamp,
        isLate: a.isLate,
        checkInMethod: a.checkInMethod,
        facialConfidenceScore: a.facialConfidenceScore,
      })),
    };
  }

  async getAttendanceTrends(dto: AnalyticsQueryDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    const meetings = await this.meetingRepository.find({
      where: {
        scheduledStart: Between(startDate, endDate),
      },
      order: { scheduledStart: 'ASC' },
    });

    const trends = await Promise.all(
      meetings.map(async (meeting) => {
        const attendance = await this.attendanceRepository.count({
          where: { meetingId: meeting.id },
        });

        const expected = meeting.expectedAttendees || 0;

        return {
          date: meeting.scheduledStart,
          meetingTitle: meeting.title,
          expected,
          actual: attendance,
          rate: expected > 0 ? (attendance / expected) * 100 : 0,
        };
      }),
    );

    return trends;
  }

  async getAttendanceHistory(sontaHeadId: string, limit: number = 50) {
    const sontaHead = await this.sontaHeadRepository.findOne({
      where: { id: sontaHeadId },
    });

    if (!sontaHead) {
      throw new NotFoundException('Sonta Head not found');
    }

    const attendance = await this.attendanceRepository.find({
      where: { sontaHeadId },
      relations: ['meeting'],
      order: { checkInTimestamp: 'DESC' },
      take: limit,
    });

    return attendance.map((a) => ({
      id: a.id,
      meeting: {
        id: a.meeting.id,
        title: a.meeting.title,
        scheduledStart: a.meeting.scheduledStart,
        locationName: a.meeting.locationName,
      },
      checkInTimestamp: a.checkInTimestamp,
      isLate: a.isLate,
      checkInMethod: a.checkInMethod,
      facialConfidenceScore: a.facialConfidenceScore,
    }));
  }

  // Helper methods
  private async getMeetingsCount(dto: AnalyticsQueryDto): Promise<number> {
    const whereClause: any = {};

    if (dto.startDate && dto.endDate) {
      whereClause.scheduledStart = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    return this.meetingRepository.count({ where: whereClause });
  }

  private async calculateAverageAttendanceRate(dto: AnalyticsQueryDto): Promise<number> {
    const whereClause: any = {};

    if (dto.startDate && dto.endDate) {
      whereClause.scheduledStart = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    const meetings = await this.meetingRepository.find({
      where: whereClause,
    });

    if (meetings.length === 0) return 0;

    let totalRate = 0;
    for (const meeting of meetings) {
      const attendance = await this.attendanceRepository.count({
        where: { meetingId: meeting.id },
      });
      const expected = meeting.expectedAttendees || 0;
      if (expected > 0) {
        totalRate += (attendance / expected) * 100;
      }
    }

    return totalRate / meetings.length;
  }

  private calculateCheckInTimeline(attendance: Attendance[], meeting: Meeting) {
    if (!meeting.actualStart) return [];

    const startTime = new Date(meeting.actualStart).getTime();
    const timeline: { time: string; count: number; cumulative: number }[] = [];

    // Group by 15-minute intervals
    const intervals = new Map<number, number>();

    attendance.forEach((a) => {
      const checkInTime = new Date(a.checkInTimestamp).getTime();
      const minutesSinceStart = Math.floor((checkInTime - startTime) / (1000 * 60));
      const interval = Math.floor(minutesSinceStart / 15) * 15; // Round to 15-min intervals

      intervals.set(interval, (intervals.get(interval) || 0) + 1);
    });

    // Sort intervals and calculate cumulative
    const sortedIntervals = Array.from(intervals.entries()).sort((a, b) => a[0] - b[0]);
    let cumulative = 0;

    sortedIntervals.forEach(([interval, count]) => {
      cumulative += count;
      timeline.push({
        time: `+${interval}min`,
        count,
        cumulative,
      });
    });

    return timeline;
  }
}
