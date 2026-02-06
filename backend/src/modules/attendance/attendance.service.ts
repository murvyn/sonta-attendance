import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';

import { Attendance, CheckInMethod } from './entities/attendance.entity';
import { VerificationAttempt, VerificationResult } from './entities/verification-attempt.entity';
import { PendingVerification, PendingVerificationStatus } from './entities/pending-verification.entity';
import { MeetingsService } from '../meetings/meetings.service';
import { Meeting, MeetingStatus } from '../meetings/entities';
import { SontaHead, SontaHeadStatus } from '../sonta-heads/entities';
import { VerifyLocationDto, CheckInDto, ManualCheckInDto, ReviewPendingDto } from './dto';
import { FacialRecognitionService } from '../../services/facial-recognition.service';
import { EncryptionService } from '../../services/encryption.service';
import { AttendanceGateway } from '../../gateways/attendance.gateway';

// Confidence thresholds
const AUTO_APPROVE_THRESHOLD = 95;
const PENDING_REVIEW_THRESHOLD = 70;
const MAX_ATTEMPTS = 3;

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(VerificationAttempt)
    private verificationAttemptRepository: Repository<VerificationAttempt>,
    @InjectRepository(PendingVerification)
    private pendingVerificationRepository: Repository<PendingVerification>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(SontaHead)
    private sontaHeadRepository: Repository<SontaHead>,
    private meetingsService: MeetingsService,
    private attendanceGateway: AttendanceGateway,
    private facialRecognitionService: FacialRecognitionService,
    private encryptionService: EncryptionService,
  ) {}

  async verifyLocation(dto: VerifyLocationDto): Promise<{ valid: boolean; distance: number }> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: dto.meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException(`Meeting is ${meeting.status}. Check-in only available for active meetings.`);
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      dto.latitude,
      dto.longitude,
      meeting.locationLatitude,
      meeting.locationLongitude,
    );

    const valid = distance <= meeting.geofenceRadiusMeters;

    return { valid, distance: Math.round(distance) };
  }

  async checkIn(
    dto: CheckInDto,
    capturedImage: Express.Multer.File,
  ): Promise<{
    status: 'approved' | 'pending' | 'rejected';
    message: string;
    attendance?: any;
    pendingVerificationId?: string;
    attemptsRemaining?: number;
    facialConfidenceScore?: number;
  }> {
    // Validate QR token
    const qrValidation = await this.meetingsService.validateQrToken(dto.qrToken);
    if (!qrValidation.valid) {
      throw new BadRequestException(qrValidation.error || 'Invalid QR code');
    }

    const meeting = await this.meetingRepository.findOne({
      where: { id: qrValidation.meeting.id },
    });

    if (!meeting || meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException('Meeting is not active');
    }

    // Verify location
    const locationResult = await this.verifyLocation({
      meetingId: meeting.id,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    if (!locationResult.valid) {
      // Log attempt
      await this.logVerificationAttempt({
        meetingId: meeting.id,
        result: VerificationResult.OUTSIDE_GEOFENCE,
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        deviceInfo: dto.deviceInfo,
        errorMessage: `Outside geofence: ${locationResult.distance}m from meeting location`,
      });

      throw new ForbiddenException({
        message: 'You must be at the meeting location to check in',
        distance: locationResult.distance,
        requiredRadius: meeting.geofenceRadiusMeters,
      });
    }

    // Increment QR scan count
    await this.meetingsService.incrementQrScanCount(dto.qrToken);

    // Save captured image
    const uploadsDir = path.join(process.cwd(), 'uploads', 'check-in-photos');
    await fs.mkdir(uploadsDir, { recursive: true });

    const imageFileName = `${meeting.id}-${Date.now()}.jpg`;
    const imagePath = path.join(uploadsDir, imageFileName);

    await sharp(capturedImage.buffer)
      .rotate() // Auto-rotate based on EXIF orientation metadata
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(imagePath);

    const capturedImageUrl = `/uploads/check-in-photos/${imageFileName}`;

    // Perform facial recognition (simulated for MVP)
    const recognitionResult = await this.performFacialRecognition(capturedImage.buffer);

    if (!recognitionResult.matchedSontaHead) {
      // Log failed attempt
      await this.logVerificationAttempt({
        meetingId: meeting.id,
        result: VerificationResult.REJECTED,
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        deviceInfo: dto.deviceInfo,
        capturedImageUrl,
        capturedImagePath: imagePath,
        facialConfidenceScore: recognitionResult.confidence,
        errorMessage: 'No matching Sonta Head found',
      });

      // Count previous attempts for this meeting
      const previousAttempts = await this.verificationAttemptRepository.count({
        where: {
          meetingId: meeting.id,
          deviceInfo: dto.deviceInfo,
        },
      });

      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - previousAttempts);

      if (attemptsRemaining === 0) {
        return {
          status: 'rejected',
          message: 'Maximum attempts reached. Please see admin for manual check-in.',
          attemptsRemaining: 0,
        };
      }

      return {
        status: 'rejected',
        message: 'Face not recognized. Please try again.',
        attemptsRemaining,
        facialConfidenceScore: recognitionResult.confidence,
      };
    }

    const sontaHead = recognitionResult.matchedSontaHead;
    const confidence = recognitionResult.confidence;

    // Check if already checked in
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { meetingId: meeting.id, sontaHeadId: sontaHead.id },
    });

    if (existingAttendance) {
      throw new ConflictException('You are already checked in to this meeting');
    }

    // Determine if late
    const isLate = this.isLateArrival(meeting);

    // Log verification attempt
    await this.logVerificationAttempt({
      meetingId: meeting.id,
      sontaHeadId: sontaHead.id,
      result: confidence >= AUTO_APPROVE_THRESHOLD ? VerificationResult.SUCCESS : VerificationResult.LOW_CONFIDENCE,
      checkInLatitude: dto.latitude,
      checkInLongitude: dto.longitude,
      deviceInfo: dto.deviceInfo,
      capturedImageUrl,
      capturedImagePath: imagePath,
      facialConfidenceScore: confidence,
    });

    // Decision based on confidence
    if (confidence >= AUTO_APPROVE_THRESHOLD) {
      // Auto-approve
      const attendance = await this.createAttendance({
        meetingId: meeting.id,
        sontaHeadId: sontaHead.id,
        checkInMethod: CheckInMethod.FACIAL_RECOGNITION,
        facialConfidenceScore: confidence,
        isLate,
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        deviceInfo: dto.deviceInfo,
      });

      // Emit WebSocket event for real-time update
      const formattedAttendance = this.formatAttendanceResponse(attendance, sontaHead, meeting);
      this.attendanceGateway.emitAttendanceUpdate(meeting.id, {
        type: 'new',
        attendance: formattedAttendance,
      });

      return {
        status: 'approved',
        message: `Check-in successful! You're marked ${isLate ? 'present (late)' : 'present'}.`,
        attendance: formattedAttendance,
        facialConfidenceScore: confidence,
      };
    } else if (confidence >= PENDING_REVIEW_THRESHOLD) {
      // Send for admin review
      const pending = await this.createPendingVerification({
        meetingId: meeting.id,
        sontaHeadId: sontaHead.id,
        capturedImageUrl,
        capturedImagePath: imagePath,
        profileImageUrl: sontaHead.profileImageUrl,
        facialConfidenceScore: confidence,
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
        deviceInfo: dto.deviceInfo,
      });

      // Emit WebSocket event for pending verification
      this.attendanceGateway.emitPendingVerification(meeting.id, {
        id: pending.id,
        sontaHead: {
          id: sontaHead.id,
          name: sontaHead.name,
          phone: sontaHead.phone,
          profileImageUrl: sontaHead.profileImageUrl,
        },
        capturedImageUrl: pending.capturedImageUrl,
        facialConfidenceScore: pending.facialConfidenceScore,
        createdAt: pending.createdAt,
      });

      return {
        status: 'pending',
        message: 'Your check-in is pending admin review.',
        pendingVerificationId: pending.id,
        facialConfidenceScore: confidence,
      };
    } else {
      // Rejected - confidence too low
      const previousAttempts = await this.verificationAttemptRepository.count({
        where: { meetingId: meeting.id, sontaHeadId: sontaHead.id },
      });

      const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - previousAttempts);

      return {
        status: 'rejected',
        message: attemptsRemaining > 0
          ? 'Face recognition confidence too low. Please try again.'
          : 'Maximum attempts reached. Please see admin for manual check-in.',
        attemptsRemaining,
        facialConfidenceScore: confidence,
      };
    }
  }

  async manualCheckIn(dto: ManualCheckInDto, adminId: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: dto.meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    if (meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException('Manual check-in only available for active meetings');
    }

    const sontaHead = await this.sontaHeadRepository.findOne({
      where: { id: dto.sontaHeadId },
    });

    if (!sontaHead) {
      throw new NotFoundException('Sonta Head not found');
    }

    // Check if already checked in
    const existing = await this.attendanceRepository.findOne({
      where: { meetingId: dto.meetingId, sontaHeadId: dto.sontaHeadId },
    });

    if (existing) {
      throw new ConflictException('This person is already checked in');
    }

    const isLate = this.isLateArrival(meeting);

    const attendance = await this.createAttendance({
      meetingId: dto.meetingId,
      sontaHeadId: dto.sontaHeadId,
      checkInMethod: CheckInMethod.MANUAL_ADMIN,
      isLate,
      checkedInByAdminId: adminId,
      notes: dto.notes,
    });

    const formattedAttendance = this.formatAttendanceResponse(attendance, sontaHead, meeting);

    // Emit WebSocket event for real-time update
    this.attendanceGateway.emitAttendanceUpdate(dto.meetingId, {
      type: 'new',
      attendance: formattedAttendance,
    });

    return formattedAttendance;
  }

  async removeAttendance(attendanceId: string): Promise<void> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['sontaHead', 'meeting'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    const meetingId = attendance.meetingId;
    await this.attendanceRepository.delete(attendanceId);

    // Emit WebSocket event for real-time update
    this.attendanceGateway.emitAttendanceUpdate(meetingId, {
      type: 'removed',
      attendanceId,
    });
  }

  async getMeetingAttendance(meetingId: string): Promise<{
    checkedIn: any[];
    notCheckedIn: any[];
    pending: any[];
    statistics: any;
  }> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    // Get all checked-in
    const attendance = await this.attendanceRepository.find({
      where: { meetingId },
      relations: ['sontaHead', 'checkedInByAdmin'],
      order: { checkInTimestamp: 'ASC' },
    });

    // Get all active sonta heads
    const allSontaHeads = await this.sontaHeadRepository.find({
      where: { status: SontaHeadStatus.ACTIVE },
    });

    const checkedInIds = new Set(attendance.map((a) => a.sontaHeadId));
    const notCheckedIn = allSontaHeads.filter((sh) => !checkedInIds.has(sh.id));

    // Get pending verifications
    const pending = await this.pendingVerificationRepository.find({
      where: { meetingId, status: PendingVerificationStatus.PENDING },
      relations: ['sontaHead'],
      order: { createdAt: 'DESC' },
    });

    const lateCount = attendance.filter((a) => a.isLate).length;
    const manualCount = attendance.filter((a) => a.checkInMethod === CheckInMethod.MANUAL_ADMIN).length;

    return {
      checkedIn: attendance.map((a) => this.formatAttendanceResponse(a, a.sontaHead, meeting)),
      notCheckedIn: notCheckedIn.map((sh) => ({
        id: sh.id,
        name: sh.name,
        phone: sh.phone,
        profileImageUrl: sh.profileImageUrl,
      })),
      pending: pending.map((p) => ({
        id: p.id,
        sontaHead: {
          id: p.sontaHead.id,
          name: p.sontaHead.name,
          profileImageUrl: p.sontaHead.profileImageUrl,
        },
        capturedImageUrl: p.capturedImageUrl,
        facialConfidenceScore: p.facialConfidenceScore,
        createdAt: p.createdAt,
      })),
      statistics: {
        totalExpected: meeting.expectedAttendees || allSontaHeads.length,
        checkedIn: attendance.length,
        notCheckedIn: notCheckedIn.length,
        pending: pending.length,
        lateArrivals: lateCount,
        manualCheckIns: manualCount,
        attendanceRate: allSontaHeads.length > 0
          ? Math.round((attendance.length / allSontaHeads.length) * 100)
          : 0,
      },
    };
  }

  async getPendingVerifications(meetingId?: string): Promise<any[]> {
    const where: any = { status: PendingVerificationStatus.PENDING };
    if (meetingId) {
      where.meetingId = meetingId;
    }

    const pending = await this.pendingVerificationRepository.find({
      where,
      relations: ['sontaHead', 'meeting'],
      order: { createdAt: 'DESC' },
    });

    return pending.map((p) => ({
      id: p.id,
      meeting: {
        id: p.meeting.id,
        title: p.meeting.title,
      },
      sontaHead: {
        id: p.sontaHead.id,
        name: p.sontaHead.name,
        phone: p.sontaHead.phone,
        profileImageUrl: p.sontaHead.profileImageUrl,
      },
      capturedImageUrl: p.capturedImageUrl,
      facialConfidenceScore: p.facialConfidenceScore,
      createdAt: p.createdAt,
    }));
  }

  async approvePendingVerification(id: string, adminId: string, dto: ReviewPendingDto): Promise<any> {
    const pending = await this.pendingVerificationRepository.findOne({
      where: { id },
      relations: ['meeting', 'sontaHead'],
    });

    if (!pending) {
      throw new NotFoundException('Pending verification not found');
    }

    if (pending.status !== PendingVerificationStatus.PENDING) {
      throw new BadRequestException('This verification has already been reviewed');
    }

    // Check if already checked in
    const existing = await this.attendanceRepository.findOne({
      where: { meetingId: pending.meetingId, sontaHeadId: pending.sontaHeadId },
    });

    if (existing) {
      // Update pending status but don't create duplicate
      pending.status = PendingVerificationStatus.APPROVED;
      pending.reviewedById = adminId;
      pending.reviewedAt = new Date();
      pending.reviewNotes = dto.notes || 'Already checked in';
      await this.pendingVerificationRepository.save(pending);

      throw new ConflictException('This person was already checked in');
    }

    const isLate = this.isLateArrival(pending.meeting);

    // Create attendance record
    const attendance = await this.createAttendance({
      meetingId: pending.meetingId,
      sontaHeadId: pending.sontaHeadId,
      checkInMethod: CheckInMethod.FACIAL_RECOGNITION,
      facialConfidenceScore: pending.facialConfidenceScore,
      isLate,
      checkInLatitude: pending.checkInLatitude,
      checkInLongitude: pending.checkInLongitude,
      deviceInfo: pending.deviceInfo,
      notes: `Admin approved (${pending.facialConfidenceScore}% confidence)`,
    });

    // Update pending status
    pending.status = PendingVerificationStatus.APPROVED;
    pending.reviewedById = adminId;
    pending.reviewedAt = new Date();
    pending.reviewNotes = dto.notes;
    await this.pendingVerificationRepository.save(pending);

    const formattedAttendance = this.formatAttendanceResponse(attendance, pending.sontaHead, pending.meeting);

    // Emit WebSocket event for real-time update
    this.attendanceGateway.emitAttendanceUpdate(pending.meetingId, {
      type: 'new',
      attendance: formattedAttendance,
    });

    return formattedAttendance;
  }

  async rejectPendingVerification(id: string, adminId: string, dto: ReviewPendingDto): Promise<void> {
    const pending = await this.pendingVerificationRepository.findOne({
      where: { id },
    });

    if (!pending) {
      throw new NotFoundException('Pending verification not found');
    }

    if (pending.status !== PendingVerificationStatus.PENDING) {
      throw new BadRequestException('This verification has already been reviewed');
    }

    pending.status = PendingVerificationStatus.REJECTED;
    pending.reviewedById = adminId;
    pending.reviewedAt = new Date();
    pending.reviewNotes = dto.notes;
    await this.pendingVerificationRepository.save(pending);
  }

  // Private helper methods

  private async createAttendance(data: Partial<Attendance>): Promise<Attendance> {
    const attendance = this.attendanceRepository.create({
      ...data,
      checkInTimestamp: new Date(),
    });
    return this.attendanceRepository.save(attendance);
  }

  private async createPendingVerification(data: Partial<PendingVerification>): Promise<PendingVerification> {
    const pending = this.pendingVerificationRepository.create(data);
    return this.pendingVerificationRepository.save(pending);
  }

  private async logVerificationAttempt(data: Partial<VerificationAttempt>): Promise<VerificationAttempt> {
    const attempt = this.verificationAttemptRepository.create(data);
    return this.verificationAttemptRepository.save(attempt);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private isLateArrival(meeting: Meeting): boolean {
    if (!meeting.lateArrivalCutoffMinutes || !meeting.actualStart) {
      return false;
    }
    const cutoffTime = new Date(meeting.actualStart);
    cutoffTime.setMinutes(cutoffTime.getMinutes() + meeting.lateArrivalCutoffMinutes);
    return new Date() > cutoffTime;
  }

  private async performFacialRecognition(imageBuffer: Buffer): Promise<{
    matchedSontaHead: SontaHead | null;
    confidence: number;
  }> {
    // Extract facial embedding from check-in photo
    const checkInEmbedding = await this.facialRecognitionService.extractEmbedding(
      imageBuffer,
    );

    if (!checkInEmbedding) {
      // No face detected in check-in photo
      return { matchedSontaHead: null, confidence: 0 };
    }

    // Load all active Sonta Heads with facial embeddings
    const sontaHeads = await this.sontaHeadRepository.find({
      where: { status: SontaHeadStatus.ACTIVE },
    });

    if (sontaHeads.length === 0) {
      return { matchedSontaHead: null, confidence: 0 };
    }

    // Decrypt and prepare embeddings for comparison
    const knownEmbeddings: Array<{
      sontaHeadId: string;
      embedding: Float32Array;
    }> = [];

    for (const sontaHead of sontaHeads) {
      if (sontaHead.facialEmbedding) {
        try {
          const decryptedEmbedding = this.encryptionService.decrypt(
            sontaHead.facialEmbedding,
          );
          knownEmbeddings.push({
            sontaHeadId: sontaHead.id,
            embedding: decryptedEmbedding,
          });
        } catch (error) {
          console.error(
            `Failed to decrypt embedding for Sonta Head ${sontaHead.id}`,
            error,
          );
        }
      }
    }

    if (knownEmbeddings.length === 0) {
      // No Sonta Heads have facial embeddings enrolled
      return { matchedSontaHead: null, confidence: 0 };
    }

    // Find best match using facial recognition service
    const bestMatch = this.facialRecognitionService.findBestMatch(
      checkInEmbedding,
      knownEmbeddings,
    );

    if (!bestMatch) {
      return { matchedSontaHead: null, confidence: 0 };
    }

    // Retrieve the matched Sonta Head
    const matchedSontaHead = sontaHeads.find(
      (sh) => sh.id === bestMatch.sontaHeadId,
    );

    return {
      matchedSontaHead: matchedSontaHead || null,
      confidence: bestMatch.confidence,
    };
  }

  private formatAttendanceResponse(attendance: Attendance, sontaHead: SontaHead, meeting: Meeting): any {
    return {
      id: attendance.id,
      sontaHead: {
        id: sontaHead.id,
        name: sontaHead.name,
        phone: sontaHead.phone,
        profileImageUrl: sontaHead.profileImageUrl,
      },
      meeting: {
        id: meeting.id,
        title: meeting.title,
      },
      checkInTimestamp: attendance.checkInTimestamp,
      checkInMethod: attendance.checkInMethod,
      facialConfidenceScore: attendance.facialConfidenceScore,
      isLate: attendance.isLate,
      verificationAttempts: attendance.verificationAttempts,
    };
  }
}
