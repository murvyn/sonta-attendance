import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewPendingDto {
  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
