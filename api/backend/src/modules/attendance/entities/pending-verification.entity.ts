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
import { AdminUser } from '../../admin/entities';

export enum PendingVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('pending_verifications')
export class PendingVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'sonta_head_id', type: 'uuid' })
  sontaHeadId: string;

  @ManyToOne(() => SontaHead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sonta_head_id' })
  sontaHead: SontaHead;

  @Column({ name: 'qr_code_id', type: 'uuid', nullable: true })
  qrCodeId?: string;

  @Column({ name: 'captured_image_url', type: 'text' })
  capturedImageUrl: string;

  @Column({ name: 'captured_image_path', type: 'text', nullable: true })
  capturedImagePath?: string;

  @Column({ name: 'profile_image_url', type: 'text' })
  profileImageUrl: string;

  @Column({ name: 'facial_confidence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  facialConfidenceScore?: number;

  @Column({ name: 'check_in_latitude', type: 'double precision', nullable: true })
  checkInLatitude?: number;

  @Column({ name: 'check_in_longitude', type: 'double precision', nullable: true })
  checkInLongitude?: number;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: PendingVerificationStatus,
    default: PendingVerificationStatus.PENDING,
  })
  status: PendingVerificationStatus;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedById?: string;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy?: AdminUser;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
