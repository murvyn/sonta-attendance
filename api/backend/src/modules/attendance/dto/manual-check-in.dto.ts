import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualCheckInDto {
  @ApiProperty({ description: 'Meeting ID' })
  @IsUUID()
  meetingId: string;

  @ApiProperty({ description: 'Sonta Head ID' })
  @IsUUID()
  sontaHeadId: string;

  @ApiPropertyOptional({ description: 'Notes for manual check-in' })
  @IsString()
  @IsOptional()
  notes?: string;
}
