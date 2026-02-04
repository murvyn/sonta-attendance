import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SontaHeadStatus } from '../entities/sonta-head.entity';

export class UpdateSontaHeadDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name of the Sonta Head' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '+233201234567', description: 'Phone number (unique)' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be a valid format (10-15 digits)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Additional notes about this Sonta Head' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    enum: SontaHeadStatus,
    description: 'Status of the Sonta Head',
  })
  @IsEnum(SontaHeadStatus)
  @IsOptional()
  status?: SontaHeadStatus;
}
