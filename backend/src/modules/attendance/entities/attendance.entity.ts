import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Meeting } from '../../meetings/entities';
import { SontaHead } from '../../sonta-heads/entities';
import { AdminUser } from '../../admin/entities';

export enum CheckInMethod {
  FACIAL_RECOGNITION = 'facial_recognition',
  MANUAL_ADMIN = 'manual_admin',
}

@Entity('attendance')
@Unique(['meetingId', 'sontaHeadId'])
export class Attendance {
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

  @Column({ name: 'check_in_timestamp', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  checkInTimestamp: Date;

  @Column({
    name: 'check_in_method',
    type: 'enum',
    enum: CheckInMethod,
  })
  checkInMethod: CheckInMethod;

  @Column({ name: 'facial_confidence_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  facialConfidenceScore?: number;

  @Column({ name: 'is_late', type: 'boolean', default: false })
  isLate: boolean;

  @Column({ name: 'verification_attempts', type: 'int', default: 1 })
  verificationAttempts: number;

  @Column({ name: 'is_suspicious', type: 'boolean', default: false })
  isSuspicious: boolean;

  @Column({ name: 'check_in_latitude', type: 'double precision', nullable: true })
  checkInLatitude?: number;

  @Column({ name: 'check_in_longitude', type: 'double precision', nullable: true })
  checkInLongitude?: number;

  @Column({ name: 'device_info', type: 'jsonb', nullable: true })
  deviceInfo?: Record<string, any>;

  @Column({ name: 'checked_in_by_admin', type: 'uuid', nullable: true })
  checkedInByAdminId?: string;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'checked_in_by_admin' })
  checkedInByAdmin?: AdminUser;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
