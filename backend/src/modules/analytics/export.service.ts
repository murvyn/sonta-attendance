import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from '../attendance/entities';
import { Meeting } from '../meetings/entities';
import { SontaHead } from '../sonta-heads/entities';
import { ExportReportDto } from './dto';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(SontaHead)
    private sontaHeadRepository: Repository<SontaHead>,
  ) {}

  async exportToCSV(dto: ExportReportDto): Promise<string> {
    const whereClause: any = {};

    if (dto.meetingId) {
      whereClause.meetingId = dto.meetingId;
    }

    if (dto.sontaHeadId) {
      whereClause.sontaHeadId = dto.sontaHeadId;
    }

    if (dto.startDate && dto.endDate) {
      whereClause.checkInTimestamp = Between(
        new Date(dto.startDate),
        new Date(dto.endDate),
      );
    }

    const attendance = await this.attendanceRepository.find({
      where: whereClause,
      relations: ['sontaHead', 'meeting'],
      order: { checkInTimestamp: 'DESC' },
    });

    // CSV Headers
    const headers = [
      'Name',
      'Phone',
      'Meeting',
      'Check-in Time',
      'Status',
      'Method',
      'Confidence Score',
      'Late',
    ];

    // CSV Rows
    const rows = attendance.map((a) => [
      a.sontaHead.name,
      a.sontaHead.phone,
      a.meeting.title,
      new Date(a.checkInTimestamp).toLocaleString(),
      'Present',
      a.checkInMethod === 'manual_admin' ? 'Manual' : 'Facial Recognition',
      a.facialConfidenceScore ? `${a.facialConfidenceScore.toFixed(1)}%` : 'N/A',
      a.isLate ? 'Yes' : 'No',
    ]);

    // Combine headers and rows
    const csvLines = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvLines;
  }

  async exportToPDF(dto: ExportReportDto): Promise<Buffer> {
    // For MVP, return a simple text-based "PDF" (placeholder)
    // In production, use a library like pdfkit or puppeteer
    const csvData = await this.exportToCSV(dto);

    const pdfContent = `
ATTENDANCE REPORT
Generated: ${new Date().toLocaleString()}

${dto.startDate && dto.endDate ? `Period: ${dto.startDate} to ${dto.endDate}` : 'All Time'}

${csvData.replace(/,/g, ' | ').replace(/"/g, '')}

---
End of Report
    `;

    return Buffer.from(pdfContent, 'utf-8');
  }
}
