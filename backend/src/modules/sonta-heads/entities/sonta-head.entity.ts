import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SontaHeadStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('sonta_heads')
export class SontaHead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'text', name: 'profile_image_url' })
  profileImageUrl: string;

  @Column({ type: 'text', nullable: true, name: 'profile_image_path' })
  profileImagePath: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'facial_embedding_id' })
  facialEmbeddingId: string;

  @Column({ type: 'bytea', nullable: true, name: 'facial_embedding' })
  facialEmbedding: Buffer;

  @Column({
    type: 'enum',
    enum: SontaHeadStatus,
    default: SontaHeadStatus.ACTIVE,
  })
  status: SontaHeadStatus;

  @Column({ type: 'date', default: () => 'CURRENT_DATE', name: 'enrollment_date' })
  enrollmentDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
