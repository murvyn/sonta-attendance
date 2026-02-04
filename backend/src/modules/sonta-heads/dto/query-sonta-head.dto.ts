import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SontaHeadStatus } from '../entities/sonta-head.entity';

export class QuerySontaHeadDto {
  @ApiPropertyOptional({ description: 'Search by name or phone' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: SontaHeadStatus, description: 'Filter by status' })
  @IsEnum(SontaHeadStatus)
  @IsOptional()
  status?: SontaHeadStatus;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
