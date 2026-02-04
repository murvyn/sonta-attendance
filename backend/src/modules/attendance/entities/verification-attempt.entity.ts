import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from '../../meetings/entities';
import { SontaHead } from '../../sonta-heads/entities';

export enum VerificationResult {
  SUCCESS = 'success',
  LOW_CONFIDENCE = 'low_confidence',
  REJECTED = 'rejected',
  LIVENESS_FAILED = 'liveness_failed',
  OUTSIDE_GEOFENCE = 'outside_geofence',
}

@Entity('verification_attempts')
export class VerificationAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'sonta_head_id', type: 'uuid', nullable: true })
  sontaHeadId?: string;

  @ManyToOne(() => SontaHead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sonta_head_id' })
  sontaHead?: SontaHead;

  @Column({ name: 'qr_code_id', type: 'uuid', nullable: true })
  qrCodeId?: string;

  @CreateDateColumn({ name: 'attempt_timestamp' })
  attemptTimestamp: Date;

  @Column({ name: 'facial_confidence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  facialConfidenceScore?: number;

  @Column({
    type: 'enum',
    enum: VerificationResult,
  })
  result: VerificationResult;

  @Column({ name: 'captured_image_url', type: 'text', nullable: true })
  capturedImageUrl?: string;

  @Column({ name: 'captured_image_path', type: 'text', nullable: true })
  capturedImagePath?: string;

  @Column({ name: 'check_in_latitude', type: 'double precision', nullable: true })
  checkInLatitude?: number;

  @Column({ name: 'check_in_longitude', type: 'double precision', nullable: true })
  checkInLongitude?: number;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;
}
