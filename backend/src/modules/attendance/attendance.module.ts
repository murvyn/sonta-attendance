import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { Attendance, VerificationAttempt, PendingVerification } from './entities';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { MeetingsModule } from '../meetings/meetings.module';
import { Meeting } from '../meetings/entities';
import { SontaHead } from '../sonta-heads/entities';
import { FacialRecognitionService } from '../../services/facial-recognition.service';
import { EncryptionService } from '../../services/encryption.service';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      VerificationAttempt,
      PendingVerification,
      Meeting,
      SontaHead,
    ]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    MeetingsModule,
    GatewaysModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, FacialRecognitionService, EncryptionService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
