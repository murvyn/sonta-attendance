import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { AttendanceService } from './attendance.service';
import {
  VerifyLocationDto,
  CheckInDto,
  ManualCheckInDto,
  ReviewPendingDto,
} from './dto';

@ApiTags('Attendance')
@Controller('api/attendance')
export class AttendanceController {
  private readonly logger = new Logger(AttendanceController.name);

  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('verify-location')
  @ApiOperation({ summary: 'Verify if user is within meeting geofence' })
  @ApiResponse({ status: 200, description: 'Location verification result' })
  @ApiResponse({ status: 400, description: 'Meeting not active' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async verifyLocation(@Body() dto: VerifyLocationDto) {
    return this.attendanceService.verifyLocation(dto);
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('capturedImage', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Check in to meeting with facial recognition' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Check-in result' })
  @ApiResponse({ status: 400, description: 'Invalid QR or meeting not active' })
  @ApiResponse({ status: 403, description: 'Outside geofence' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  async checkIn(
    @Body() body: any,
    @UploadedFile() capturedImage: Express.Multer.File,
  ) {
    try {
      this.logger.log('Check-in request received');
      this.logger.log(`Raw body: ${JSON.stringify(body)}`);
      this.logger.log(
        `File: ${capturedImage ? capturedImage.originalname : 'NO FILE'}`,
      );
      this.logger.log(
        `File mimetype: ${capturedImage ? capturedImage.mimetype : 'N/A'}`,
      );
      this.logger.log(
        `File size: ${capturedImage ? capturedImage.size : 0} bytes`,
      );

      if (!capturedImage) {
        this.logger.error('No captured image provided');
        throw new Error('Captured image is required');
      }

      // Manually construct and validate DTO from FormData
      const dto: CheckInDto = {
        qrToken: body.qrToken,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        deviceInfo: body.deviceInfo || undefined,
      };

      this.logger.log(`Processed DTO: ${JSON.stringify(dto)}`);
      this.logger.log(
        `Processed types - latitude: ${typeof dto.latitude}, longitude: ${typeof dto.longitude}`,
      );

      // Basic validation
      if (!dto.qrToken || isNaN(dto.latitude) || isNaN(dto.longitude)) {
        this.logger.error('Invalid DTO data');
        throw new Error('Invalid check-in data');
      }

      return this.attendanceService.checkIn(dto, capturedImage);
    } catch (error) {
      this.logger.error('Check-in error:', error);
      throw error;
    }
  }

  @Post('manual-check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manual check-in by admin' })
  @ApiResponse({ status: 201, description: 'Manual check-in successful' })
  @ApiResponse({ status: 400, description: 'Meeting not active' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  async manualCheckIn(@Body() dto: ManualCheckInDto, @CurrentUser() user: any) {
    return this.attendanceService.manualCheckIn(dto, user.sub);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance ID' })
  @ApiResponse({ status: 204, description: 'Attendance removed' })
  @ApiResponse({ status: 404, description: 'Attendance not found' })
  async removeAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.removeAttendance(id);
  }

  @Get('meeting/:meetingId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get meeting attendance details' })
  @ApiParam({ name: 'meetingId', description: 'Meeting ID' })
  @ApiResponse({ status: 200, description: 'Meeting attendance data' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getMeetingAttendance(
    @Param('meetingId', ParseUUIDPipe) meetingId: string,
  ) {
    return this.attendanceService.getMeetingAttendance(meetingId);
  }

  @Get('pending-verifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get pending verifications' })
  @ApiQuery({
    name: 'meetingId',
    required: false,
    description: 'Filter by meeting',
  })
  @ApiResponse({ status: 200, description: 'List of pending verifications' })
  async getPendingVerifications(@Query('meetingId') meetingId?: string) {
    return this.attendanceService.getPendingVerifications(meetingId);
  }

  @Patch('pending-verifications/:id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Approve pending verification' })
  @ApiParam({ name: 'id', description: 'Pending verification ID' })
  @ApiResponse({ status: 200, description: 'Verification approved' })
  @ApiResponse({ status: 404, description: 'Pending verification not found' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  async approvePendingVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewPendingDto,
  ) {
    return this.attendanceService.approvePendingVerification(id, user.sub, dto);
  }

  @Patch('pending-verifications/:id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reject pending verification' })
  @ApiParam({ name: 'id', description: 'Pending verification ID' })
  @ApiResponse({ status: 204, description: 'Verification rejected' })
  @ApiResponse({ status: 404, description: 'Pending verification not found' })
  async rejectPendingVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewPendingDto,
  ) {
    return this.attendanceService.rejectPendingVerification(id, user.sub, dto);
  }
}
