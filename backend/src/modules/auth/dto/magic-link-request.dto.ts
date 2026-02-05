import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MagicLinkRequestDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
