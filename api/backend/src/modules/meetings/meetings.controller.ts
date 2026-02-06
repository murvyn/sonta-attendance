import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto, QueryMeetingDto } from './dto';

@ApiTags('Meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 201, description: 'Meeting created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUser() user: any,
  ) {
    return this.meetingsService.create(createMeetingDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meetings with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of meetings' })
  async findAll(@Query() query: QueryMeetingDto) {
    return this.meetingsService.findAll(query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming meetings' })
  @ApiResponse({ status: 200, description: 'List of upcoming meetings' })
  async getUpcoming() {
    return this.meetingsService.findAll({
      status: undefined,
      fromDate: new Date().toISOString(),
      page: 1,
      limit: 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting details' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot edit non-scheduled meeting' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ) {
    return this.meetingsService.update(id, updateMeetingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 204, description: 'Meeting deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete active meeting' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.remove(id);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting started' })
  @ApiResponse({ status: 400, description: 'Meeting cannot be started' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async startMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.startMeeting(id);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'End meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting ended' })
  @ApiResponse({ status: 400, description: 'Meeting cannot be ended' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async endMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.endMeeting(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting cancelled' })
  @ApiResponse({ status: 400, description: 'Meeting cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async cancelMeeting(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.cancelMeeting(id);
  }

  @Post(':id/regenerate-qr')
  @ApiOperation({ summary: 'Regenerate QR code for meeting' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'New QR code generated' })
  @ApiResponse({ status: 400, description: 'Cannot regenerate QR' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async regenerateQr(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.meetingsService.regenerateQrCode(id, user.sub);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get meeting statistics' })
  @ApiParam({ name: 'id', description: 'Meeting UUID' })
  @ApiResponse({ status: 200, description: 'Meeting statistics' })
  @ApiResponse({ status: 404, description: 'Meeting not found' })
  async getStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.getMeetingStatistics(id);
  }
}
