import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SontaHeadStatus } from '../entities/sonta-head.entity';

export class CreateSontaHeadDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the Sonta Head' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Sonta Alpha', description: 'Name of the sonta group' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  sontaName?: string;

  @ApiProperty({ example: '+233201234567', description: 'Phone number (unique)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Phone number must be a valid format (10-15 digits)',
  })
  phone: string;

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
    default: SontaHeadStatus.ACTIVE,
    description: 'Status of the Sonta Head',
  })
  @IsEnum(SontaHeadStatus)
  @IsOptional()
  status?: SontaHeadStatus;
}
