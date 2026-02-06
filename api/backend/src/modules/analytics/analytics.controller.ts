import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { AnalyticsQueryDto, ExportReportDto } from './dto';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly exportService: ExportService,
  ) {}

  @Get('overview')
  async getOverview(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getOverview(dto);
  }

  @Get('sonta-head/:id')
  async getSontaHeadAnalytics(
    @Param('id') id: string,
    @Query() dto: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getSontaHeadAnalytics(id, dto);
  }

  @Get('sonta-head/:id/history')
  async getAttendanceHistory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getAttendanceHistory(
      id,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get('meeting/:id')
  async getMeetingAnalytics(@Param('id') id: string) {
    return this.analyticsService.getMeetingAnalytics(id);
  }

  @Get('attendance-trends')
  async getAttendanceTrends(@Query() dto: AnalyticsQueryDto) {
    return this.analyticsService.getAttendanceTrends(dto);
  }

  @Post('export-report')
  async exportReport(
    @Query() dto: ExportReportDto,
    @Res() res: Response,
  ) {
    const { format, ...queryDto } = dto;

    if (format === 'csv') {
      const csvData = await this.exportService.exportToCSV(dto);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=attendance-report-${Date.now()}.csv`,
      );
      return res.send(csvData);
    } else if (format === 'pdf') {
      const pdfBuffer = await this.exportService.exportToPDF(dto);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=attendance-report-${Date.now()}.pdf`,
      );
      return res.send(pdfBuffer);
    }
  }
}
