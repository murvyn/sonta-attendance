import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '../entities/admin-user.entity';

export class UpdateAdminDto {
  @ApiPropertyOptional({ example: 'johndoe', description: 'Unique username' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({
    enum: AdminRole,
    description: 'Admin role',
  })
  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @ApiPropertyOptional({ description: 'Account active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
