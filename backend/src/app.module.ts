import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { join } from 'path';

import { databaseConfig, jwtConfig, emailConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SontaHeadsModule } from './modules/sonta-heads/sonta-heads.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FacialRecognitionModule } from './modules/facial-recognition/facial-recognition.module';
import { GatewaysModule } from './gateways/gateways.module';
import { AdminUser, AuditLog } from './modules/admin/entities';
import { SontaHead } from './modules/sonta-heads/entities';
import { Meeting, QrCode } from './modules/meetings/entities';
import {
  Attendance,
  VerificationAttempt,
  PendingVerification,
} from './modules/attendance/entities';
import { MagicLinkToken } from './modules/auth/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, emailConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [
          AdminUser,
          AuditLog,
          SontaHead,
          Meeting,
          QrCode,
          Attendance,
          VerificationAttempt,
          PendingVerification,
          MagicLinkToken,
        ],
        synchronize: false, // Never use synchronize in production - use migrations
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true, // Automatically run pending migrations on startup
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    AdminModule,
    SontaHeadsModule,
    MeetingsModule,
    AttendanceModule,
    AnalyticsModule,
    FacialRecognitionModule,
    GatewaysModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
