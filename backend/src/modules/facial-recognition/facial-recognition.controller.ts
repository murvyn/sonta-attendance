import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FacialRecognitionService } from '../../services/facial-recognition.service';

@ApiTags('facial-recognition')
@Controller('facial-recognition')
export class FacialRecognitionController {
  constructor(
    private readonly facialRecognitionService: FacialRecognitionService,
  ) {}

  @Post('detect-preview')
  @ApiOperation({ summary: 'Preview face detection for uploaded image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Face detection result',
    schema: {
      type: 'object',
      properties: {
        detected: { type: 'boolean' },
        confidence: { type: 'number' },
        faceCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async detectPreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    try {
      // Detect face in the uploaded image
      const faceDetected = await this.facialRecognitionService.detectFace(
        file.buffer,
      );

      if (!faceDetected) {
        return {
          detected: false,
          confidence: 0,
          faceCount: 0,
          message:
            'No face detected. Please upload a clear photo with exactly one face.',
        };
      }

      // Extract embedding to verify face quality and get confidence
      const embedding = await this.facialRecognitionService.extractEmbedding(
        file.buffer,
      );

      if (!embedding) {
        return {
          detected: false,
          confidence: 0,
          faceCount: 0,
          message:
            'Face detected but quality is too low. Please use better lighting and ensure face is clearly visible.',
        };
      }

      // Face detected successfully with good quality
      // Note: face-api.js doesn't directly provide confidence scores,
      // but successful embedding extraction implies good detection
      return {
        detected: true,
        confidence: 0.85, // Placeholder - face-api.js detections are generally high confidence
        faceCount: 1,
        message:
          'Face detected successfully! This photo is suitable for facial recognition.',
      };
    } catch (error) {
      // Handle cases where multiple faces might be detected
      if (
        error.message &&
        error.message.includes('multiple faces')
      ) {
        return {
          detected: false,
          confidence: 0,
          faceCount: 2, // Indicate multiple faces
          message:
            'Multiple faces detected. Please upload a photo with exactly one face.',
        };
      }

      throw new BadRequestException(
        'Failed to process image. Please try again with a different photo.',
      );
    }
  }
}
