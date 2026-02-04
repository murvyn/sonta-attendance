import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AdminUser, AuditLog } from '../modules/admin/entities';
import { SontaHead } from '../modules/sonta-heads/entities';
import { Meeting, QrCode } from '../modules/meetings/entities';
import {
  Attendance,
  VerificationAttempt,
  PendingVerification,
} from '../modules/attendance/entities';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'sonta',
  password: process.env.DATABASE_PASSWORD || 'sonta_password',
  database: process.env.DATABASE_NAME || 'sonta_attendance',
  entities: [
    AdminUser,
    AuditLog,
    SontaHead,
    Meeting,
    QrCode,
    Attendance,
    VerificationAttempt,
    PendingVerification,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
