import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SontaHeadsController } from './sonta-heads.controller';
import { SontaHeadsService } from './sonta-heads.service';
import { SontaHead } from './entities/sonta-head.entity';
import { FacialRecognitionService } from '../../services/facial-recognition.service';
import { EncryptionService } from '../../services/encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([SontaHead])],
  controllers: [SontaHeadsController],
  providers: [SontaHeadsService, FacialRecognitionService, EncryptionService],
  exports: [SontaHeadsService],
})
export class SontaHeadsModule {}
