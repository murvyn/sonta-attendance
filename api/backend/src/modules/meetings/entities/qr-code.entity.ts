import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meeting } from './meeting.entity';
import { AdminUser } from '../../admin/entities';

@Entity('qr_codes')
export class QrCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'meeting_id', type: 'uuid' })
  meetingId: string;

  @ManyToOne(() => Meeting, (meeting) => meeting.qrCodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Meeting;

  @Column({ name: 'qr_token', type: 'text', unique: true })
  qrToken: string;

  @Column({ name: 'qr_image_url', type: 'text', nullable: true })
  qrImageUrl: string;

  @Column({ name: 'qr_image_path', type: 'text', nullable: true })
  qrImagePath: string;

  @Column({ name: 'scan_count', type: 'int', default: 0 })
  scanCount: number;

  @Column({ name: 'max_scans', type: 'int', nullable: true })
  maxScans?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'invalidated_at', type: 'timestamp', nullable: true })
  invalidatedAt: Date;

  @Column({ name: 'invalidated_by', type: 'uuid', nullable: true })
  invalidatedById: string;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invalidated_by' })
  invalidatedBy: AdminUser;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
