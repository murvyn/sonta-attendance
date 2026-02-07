import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

export interface CloudinaryUploadOptions {
  folder: string;
  publicId?: string;
  transformation?: any;
  resourceType?: 'image' | 'raw' | 'video' | 'auto';
  format?: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  resourceType: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('cloudinary.cloudName');
    const apiKey = this.configService.get<string>('cloudinary.apiKey');
    const apiSecret = this.configService.get<string>('cloudinary.apiSecret');
    this.enabled = this.configService.get<boolean>('cloudinary.enabled', true);

    if (this.enabled && cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.logger.log('Cloudinary configured successfully');
    } else if (this.enabled) {
      this.logger.warn(
        'Cloudinary is enabled but credentials are missing. Uploads will fail.',
      );
    } else {
      this.logger.log('Cloudinary is disabled - using local storage');
    }
  }

  /**
   * Upload image buffer to Cloudinary
   */
  async uploadImage(
    buffer: Buffer,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    if (!this.enabled) {
      throw new InternalServerErrorException('Cloudinary is disabled');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          transformation: options.transformation,
          resource_type: options.resourceType || 'image',
          format: options.format,
          overwrite: false,
          unique_filename: !options.publicId,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            reject(
              new InternalServerErrorException(
                'Failed to upload image to Cloudinary',
              ),
            );
          } else if (result) {
            resolve({
              publicId: result.public_id,
              secureUrl: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              resourceType: result.resource_type,
              bytes: result.bytes,
            });
          } else {
            reject(
              new InternalServerErrorException(
                'No result from Cloudinary upload',
              ),
            );
          }
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Cloudinary is disabled - skipping delete');
      return;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        this.logger.log(`Deleted image: ${publicId}`);
      } else {
        this.logger.warn(
          `Failed to delete image: ${publicId}, result: ${result.result}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error deleting image from Cloudinary: ${publicId}`,
        error,
      );
      // Don't throw - deletion failures shouldn't break the application
    }
  }

  /**
   * Generate transformation URL for existing Cloudinary image
   */
  getTransformedUrl(publicId: string, transformation: any): string {
    return cloudinary.url(publicId, {
      transformation,
      secure: true,
    });
  }

  /**
   * Check if Cloudinary is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
