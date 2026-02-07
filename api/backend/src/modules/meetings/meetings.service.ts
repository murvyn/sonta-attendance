import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import * as path from 'path';

import { Meeting, MeetingStatus, QrCode, QrExpiryStrategy } from './entities';
import { CreateMeetingDto, UpdateMeetingDto, QueryMeetingDto } from './dto';
import { AttendanceGateway } from '../../gateways/attendance.gateway';
import { CloudinaryService } from '../../services/cloudinary.service';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(QrCode)
    private qrCodeRepository: Repository<QrCode>,
    private attendanceGateway: AttendanceGateway,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateMeetingDto, adminId: string): Promise<Meeting> {
    // Validate dates
    const startDate = new Date(dto.scheduledStart);
    const endDate = new Date(dto.scheduledEnd);

    if (startDate >= endDate) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Start time cannot be in the past');
    }

    // Create meeting
    const meeting = this.meetingRepository.create({
      ...dto,
      scheduledStart: startDate,
      scheduledEnd: endDate,
      geofenceRadiusMeters: dto.geofenceRadiusMeters || 100,
      qrExpiryStrategy: dto.qrExpiryStrategy || QrExpiryStrategy.UNTIL_END,
      createdById: adminId,
    });

    const savedMeeting = await this.meetingRepository.save(meeting);

    // Generate initial QR code
    await this.generateQrCode(savedMeeting);

    return this.findOne(savedMeeting.id);
  }

  async findAll(query: QueryMeetingDto) {
    const { status, fromDate, toDate, page = 1, limit = 20 } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (fromDate && toDate) {
      where.scheduledStart = Between(new Date(fromDate), new Date(toDate));
    } else if (fromDate) {
      where.scheduledStart = MoreThanOrEqual(new Date(fromDate));
    } else if (toDate) {
      where.scheduledStart = LessThanOrEqual(new Date(toDate));
    }

    const [data, total] = await this.meetingRepository.findAndCount({
      where,
      relations: ['createdBy', 'qrCodes'],
      order: { scheduledStart: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((meeting) => this.formatMeetingResponse(meeting)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['createdBy', 'qrCodes'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    return this.formatMeetingResponse(meeting);
  }

  async update(id: string, dto: UpdateMeetingDto): Promise<any> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException('Can only edit scheduled meetings');
    }

    // Validate dates if provided
    const startDate = dto.scheduledStart
      ? new Date(dto.scheduledStart)
      : meeting.scheduledStart;
    const endDate = dto.scheduledEnd
      ? new Date(dto.scheduledEnd)
      : meeting.scheduledEnd;

    if (startDate >= endDate) {
      throw new BadRequestException('End time must be after start time');
    }

    await this.meetingRepository.update(id, {
      ...dto,
      scheduledStart: startDate,
      scheduledEnd: endDate,
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    if (meeting.status === MeetingStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete an active meeting');
    }

    // Delete QR code images
    const qrCodes = await this.qrCodeRepository.find({
      where: { meetingId: id },
    });

    for (const qr of qrCodes) {
      if (qr.qrImagePath) {
        if (qr.qrImagePath.startsWith('sonta-attendance/')) {
          // Cloudinary public_id
          await this.cloudinaryService.deleteImage(qr.qrImagePath);
        } else {
          // Local file path
          try {
            await fs.unlink(qr.qrImagePath);
          } catch {
            // Ignore file not found errors
          }
        }
      }
    }

    await this.meetingRepository.delete(id);
  }

  async startMeeting(id: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['qrCodes'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new BadRequestException(
        `Meeting is already ${meeting.status}. Can only start scheduled meetings.`,
      );
    }

    // Update meeting status
    meeting.status = MeetingStatus.ACTIVE;
    meeting.actualStart = new Date();
    await this.meetingRepository.save(meeting);

    // Activate current QR code and set expiry based on strategy
    const activeQr = meeting.qrCodes.find((qr) => qr.isActive);
    if (activeQr) {
      if (meeting.qrExpiryStrategy === QrExpiryStrategy.TIME_BASED && meeting.qrExpiryMinutes) {
        activeQr.expiresAt = new Date(
          Date.now() + meeting.qrExpiryMinutes * 60 * 1000,
        );
        await this.qrCodeRepository.save(activeQr);
      }
    }

    // Emit WebSocket event for meeting status change
    this.attendanceGateway.emitMeetingStatusChanged(id, MeetingStatus.ACTIVE);

    return this.findOne(id);
  }

  async endMeeting(id: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['qrCodes'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    if (meeting.status !== MeetingStatus.ACTIVE) {
      throw new BadRequestException('Can only end active meetings');
    }

    // Update meeting status
    meeting.status = MeetingStatus.ENDED;
    meeting.actualEnd = new Date();
    await this.meetingRepository.save(meeting);

    // Invalidate all QR codes
    await this.qrCodeRepository.update(
      { meetingId: id },
      { isActive: false, invalidatedAt: new Date() },
    );

    // Emit WebSocket event for meeting status change
    this.attendanceGateway.emitMeetingStatusChanged(id, MeetingStatus.ENDED);

    return this.findOne(id);
  }

  async cancelMeeting(id: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({ where: { id } });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    if (meeting.status === MeetingStatus.ACTIVE) {
      throw new BadRequestException('Cannot cancel an active meeting. End it first.');
    }

    if (meeting.status === MeetingStatus.ENDED) {
      throw new BadRequestException('Cannot cancel an ended meeting');
    }

    meeting.status = MeetingStatus.CANCELLED;
    await this.meetingRepository.save(meeting);

    // Invalidate all QR codes
    await this.qrCodeRepository.update(
      { meetingId: id },
      { isActive: false, invalidatedAt: new Date() },
    );

    // Emit WebSocket event for meeting status change
    this.attendanceGateway.emitMeetingStatusChanged(id, MeetingStatus.CANCELLED);

    return this.findOne(id);
  }

  async regenerateQrCode(meetingId: string, adminId: string): Promise<any> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${meetingId}" not found`);
    }

    if (meeting.status === MeetingStatus.ENDED || meeting.status === MeetingStatus.CANCELLED) {
      throw new BadRequestException('Cannot regenerate QR for ended or cancelled meeting');
    }

    // Invalidate all existing QR codes
    await this.qrCodeRepository.update(
      { meetingId, isActive: true },
      { isActive: false, invalidatedAt: new Date(), invalidatedById: adminId },
    );

    // Generate new QR code
    const newQr = await this.generateQrCode(meeting);

    const formattedQr = {
      ...newQr,
      qrImageUrl: `/uploads/qr-codes/${path.basename(newQr.qrImagePath)}`,
    };

    // Emit WebSocket event for QR regeneration
    this.attendanceGateway.emitQrRegenerated(meetingId, formattedQr);

    return formattedQr;
  }

  async getActiveQrCode(meetingId: string): Promise<QrCode | null> {
    return this.qrCodeRepository.findOne({
      where: { meetingId, isActive: true },
    });
  }

  async validateQrToken(token: string): Promise<{ valid: boolean; meeting?: any; error?: string }> {
    try {
      // Decode and verify token
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const parts = decoded.split(':');

      if (parts.length !== 4) {
        return { valid: false, error: 'Invalid QR format' };
      }

      const [meetingId, timestamp, randomBytes, signature] = parts;

      // Verify signature
      const hmac = crypto.createHmac('sha256', process.env.QR_SECRET || 'dev-qr-secret');
      hmac.update(`${meetingId}:${timestamp}:${randomBytes}`);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid QR signature' };
      }

      // Find QR code record
      const qrCode = await this.qrCodeRepository.findOne({
        where: { qrToken: token, isActive: true },
        relations: ['meeting'],
      });

      if (!qrCode) {
        return { valid: false, error: 'QR code not found or invalidated' };
      }

      const meeting = qrCode.meeting;

      // Check meeting status
      if (meeting.status !== MeetingStatus.ACTIVE) {
        return { valid: false, error: `Meeting is ${meeting.status}` };
      }

      // Check expiry based on strategy
      if (meeting.qrExpiryStrategy === QrExpiryStrategy.TIME_BASED) {
        if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
          return { valid: false, error: 'QR code has expired' };
        }
      }

      if (meeting.qrExpiryStrategy === QrExpiryStrategy.MAX_SCANS) {
        if (qrCode.maxScans && qrCode.scanCount >= qrCode.maxScans) {
          return { valid: false, error: 'QR code max scans reached' };
        }
      }

      return {
        valid: true,
        meeting: this.formatMeetingResponse(meeting),
      };
    } catch {
      return { valid: false, error: 'Invalid QR token' };
    }
  }

  async incrementQrScanCount(token: string): Promise<void> {
    await this.qrCodeRepository.increment({ qrToken: token }, 'scanCount', 1);
  }

  async getMeetingStatistics(id: string): Promise<any> {
    const meeting = await this.findOne(id);

    // This will be expanded when attendance module is implemented
    return {
      meeting,
      totalExpected: meeting.expectedAttendees || 0,
      checkedIn: 0,
      pending: 0,
      lateArrivals: 0,
      attendanceRate: 0,
    };
  }

  private async generateQrCode(meeting: Meeting): Promise<QrCode> {
    // Generate secure token
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const payload = `${meeting.id}:${timestamp}:${randomBytes}`;

    const hmac = crypto.createHmac('sha256', process.env.QR_SECRET || 'dev-qr-secret');
    hmac.update(payload);
    const signature = hmac.digest('hex');

    const qrToken = Buffer.from(`${payload}:${signature}`).toString('base64url');

    // Generate QR code URL (check-in page URL)
    const checkInUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/check-in/${qrToken}`;

    // Generate QR code to buffer
    const qrBuffer = await QRCode.toBuffer(checkInUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      type: 'png',
    });

    let qrImagePath: string;
    let qrImageUrl: string;

    if (this.cloudinaryService.isEnabled()) {
      // Upload to Cloudinary
      const result = await this.cloudinaryService.uploadImage(qrBuffer, {
        folder: 'sonta-attendance/qr-codes',
        publicId: `qr-${meeting.id}-${Date.now()}`,
        format: 'png',
      });

      qrImagePath = result.publicId;
      qrImageUrl = result.secureUrl;
    } else {
      // Fallback to local storage
      const uploadsDir = path.join(process.cwd(), 'uploads', 'qr-codes');
      await fs.mkdir(uploadsDir, { recursive: true });
      const qrFileName = `${meeting.id}-${Date.now()}.png`;
      const qrFilePath = path.join(uploadsDir, qrFileName);
      await fs.writeFile(qrFilePath, qrBuffer);
      qrImagePath = qrFilePath;
      qrImageUrl = `/uploads/qr-codes/${qrFileName}`;
    }

    // Create QR code record
    const qrCode = this.qrCodeRepository.create({
      meetingId: meeting.id,
      qrToken,
      qrImagePath,
      qrImageUrl,
      maxScans: meeting.qrExpiryStrategy === QrExpiryStrategy.MAX_SCANS ? meeting.qrMaxScans : undefined,
      isActive: true,
    });

    return this.qrCodeRepository.save(qrCode);
  }

  private formatMeetingResponse(meeting: Meeting): any {
    const activeQr = meeting.qrCodes?.find((qr) => qr.isActive);

    return {
      id: meeting.id,
      title: meeting.title,
      description: meeting.description,
      locationName: meeting.locationName,
      locationAddress: meeting.locationAddress,
      locationLatitude: meeting.locationLatitude,
      locationLongitude: meeting.locationLongitude,
      geofenceRadiusMeters: meeting.geofenceRadiusMeters,
      scheduledStart: meeting.scheduledStart,
      scheduledEnd: meeting.scheduledEnd,
      actualStart: meeting.actualStart,
      actualEnd: meeting.actualEnd,
      lateArrivalCutoffMinutes: meeting.lateArrivalCutoffMinutes,
      qrExpiryStrategy: meeting.qrExpiryStrategy,
      qrExpiryMinutes: meeting.qrExpiryMinutes,
      qrMaxScans: meeting.qrMaxScans,
      status: meeting.status,
      expectedAttendees: meeting.expectedAttendees,
      createdBy: meeting.createdBy
        ? {
            id: meeting.createdBy.id,
            fullName: meeting.createdBy.fullName,
          }
        : null,
      qrCode: activeQr
        ? {
            id: activeQr.id,
            qrImageUrl: activeQr.qrImageUrl,
            scanCount: activeQr.scanCount,
            isActive: activeQr.isActive,
            expiresAt: activeQr.expiresAt,
          }
        : null,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    };
  }
}
