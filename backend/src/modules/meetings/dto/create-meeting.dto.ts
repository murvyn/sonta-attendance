import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QrExpiryStrategy } from '../entities';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Location name (e.g., "Main Conference Room")' })
  @IsString()
  @IsNotEmpty()
  locationName: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsString()
  @IsOptional()
  locationAddress?: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  locationLatitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  locationLongitude: number;

  @ApiPropertyOptional({ description: 'Geofence radius in meters', default: 100 })
  @IsNumber()
  @IsOptional()
  @Min(10)
  @Max(1000)
  geofenceRadiusMeters?: number;

  @ApiProperty({ description: 'Scheduled start time (ISO 8601)' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ description: 'Scheduled end time (ISO 8601)' })
  @IsDateString()
  scheduledEnd: string;

  @ApiPropertyOptional({ description: 'Minutes after start to flag as late' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(120)
  lateArrivalCutoffMinutes?: number;

  @ApiPropertyOptional({
    description: 'QR code expiry strategy',
    enum: QrExpiryStrategy,
    default: QrExpiryStrategy.UNTIL_END,
  })
  @IsEnum(QrExpiryStrategy)
  @IsOptional()
  qrExpiryStrategy?: QrExpiryStrategy;

  @ApiPropertyOptional({ description: 'QR expiry minutes (for time_based strategy)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @ValidateIf((o) => o.qrExpiryStrategy === QrExpiryStrategy.TIME_BASED)
  qrExpiryMinutes?: number;

  @ApiPropertyOptional({ description: 'Max scans (for max_scans strategy)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @ValidateIf((o) => o.qrExpiryStrategy === QrExpiryStrategy.MAX_SCANS)
  qrMaxScans?: number;

  @ApiPropertyOptional({ description: 'Expected number of attendees' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  expectedAttendees?: number;
}
