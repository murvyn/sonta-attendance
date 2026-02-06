import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/entities';
import { Meeting } from '../meetings/entities';
import { SontaHead } from '../sonta-heads/entities';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Meeting, SontaHead]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ExportService],
  exports: [AnalyticsService, ExportService],
})
export class AnalyticsModule {}
