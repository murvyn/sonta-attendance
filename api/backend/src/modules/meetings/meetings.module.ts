import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meeting, QrCode } from './entities';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { QrController } from './qr.controller';
import { GatewaysModule } from '../../gateways/gateways.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, QrCode]),
    GatewaysModule,
  ],
  controllers: [MeetingsController, QrController],
  providers: [MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
