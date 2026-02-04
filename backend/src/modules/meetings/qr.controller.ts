import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';

@ApiTags('QR Codes')
@Controller('api/qr')
export class QrController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get(':token/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate QR token (public endpoint for check-in)' })
  @ApiParam({ name: 'token', description: 'QR token from scanned code' })
  @ApiResponse({ status: 200, description: 'QR validation result' })
  @ApiResponse({ status: 400, description: 'Invalid or expired QR' })
  async validateQr(@Param('token') token: string) {
    const result = await this.meetingsService.validateQrToken(token);

    if (!result.valid) {
      throw new BadRequestException({
        message: result.error,
        code: 'QR_INVALID',
      });
    }

    return {
      valid: true,
      meeting: {
        id: result.meeting.id,
        title: result.meeting.title,
        status: result.meeting.status,
        locationName: result.meeting.locationName,
        locationLatitude: result.meeting.locationLatitude,
        locationLongitude: result.meeting.locationLongitude,
        geofenceRadiusMeters: result.meeting.geofenceRadiusMeters,
        lateArrivalCutoffMinutes: result.meeting.lateArrivalCutoffMinutes,
        actualStart: result.meeting.actualStart,
      },
    };
  }

  @Get(':token/info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get QR code info (public endpoint)' })
  @ApiParam({ name: 'token', description: 'QR token from scanned code' })
  @ApiResponse({ status: 200, description: 'QR code information' })
  @ApiResponse({ status: 400, description: 'Invalid QR' })
  async getQrInfo(@Param('token') token: string) {
    const result = await this.meetingsService.validateQrToken(token);

    if (!result.valid) {
      throw new BadRequestException({
        message: result.error,
        code: 'QR_INVALID',
      });
    }

    // Return limited info for public display
    return {
      meeting: {
        title: result.meeting.title,
        locationName: result.meeting.locationName,
        scheduledStart: result.meeting.scheduledStart,
        scheduledEnd: result.meeting.scheduledEnd,
        status: result.meeting.status,
      },
    };
  }
}
