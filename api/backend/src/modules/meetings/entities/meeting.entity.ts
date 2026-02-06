import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AdminUser } from '../../admin/entities';

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum QrExpiryStrategy {
  UNTIL_END = 'until_end',
  MAX_SCANS = 'max_scans',
  TIME_BASED = 'time_based',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'location_name', length: 255 })
  locationName: string;

  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress: string;

  @Column({ name: 'location_latitude', type: 'double precision' })
  locationLatitude: number;

  @Column({ name: 'location_longitude', type: 'double precision' })
  locationLongitude: number;

  @Column({ name: 'geofence_radius_meters', type: 'int', default: 100 })
  geofenceRadiusMeters: number;

  @Column({ name: 'scheduled_start', type: 'timestamp' })
  scheduledStart: Date;

  @Column({ name: 'scheduled_end', type: 'timestamp' })
  scheduledEnd: Date;

  @Column({ name: 'actual_start', type: 'timestamp', nullable: true })
  actualStart: Date;

  @Column({ name: 'actual_end', type: 'timestamp', nullable: true })
  actualEnd: Date;

  @Column({ name: 'late_arrival_cutoff_minutes', type: 'int', nullable: true })
  lateArrivalCutoffMinutes: number;

  @Column({
    name: 'qr_expiry_strategy',
    type: 'enum',
    enum: QrExpiryStrategy,
    default: QrExpiryStrategy.UNTIL_END,
  })
  qrExpiryStrategy: QrExpiryStrategy;

  @Column({ name: 'qr_expiry_minutes', type: 'int', nullable: true })
  qrExpiryMinutes: number;

  @Column({ name: 'qr_max_scans', type: 'int', nullable: true })
  qrMaxScans: number;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  @Column({ name: 'expected_attendees', type: 'int', nullable: true })
  expectedAttendees: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => AdminUser, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  createdBy: AdminUser;

  @OneToMany('QrCode', 'meeting')
  qrCodes: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
