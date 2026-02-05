import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkVerifyDto {
  @ApiProperty({ description: 'Magic link token (64 characters)' })
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  token: string;
}
