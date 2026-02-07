import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SontaHead, SontaHeadStatus } from './entities/sonta-head.entity';
import { CreateSontaHeadDto, UpdateSontaHeadDto, QuerySontaHeadDto } from './dto';
import { FacialRecognitionService } from '../../services/facial-recognition.service';
import { EncryptionService } from '../../services/encryption.service';
import { CloudinaryService } from '../../services/cloudinary.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SontaHeadsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'profiles');

  constructor(
    @InjectRepository(SontaHead)
    private readonly sontaHeadRepository: Repository<SontaHead>,
    private readonly facialRecognitionService: FacialRecognitionService,
    private readonly encryptionService: EncryptionService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    // Only create upload dir if Cloudinary is disabled
    if (!this.cloudinaryService.isEnabled()) {
      this.ensureUploadDir();
    }
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async create(
    createSontaHeadDto: CreateSontaHeadDto,
    imageFile?: Express.Multer.File,
  ): Promise<SontaHead> {
    const existingByPhone = await this.sontaHeadRepository.findOne({
      where: { phone: createSontaHeadDto.phone },
    });
    if (existingByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    if (!imageFile) {
      throw new BadRequestException('Profile image is required');
    }

    // Extract facial embedding from uploaded image
    const embedding = await this.facialRecognitionService.extractEmbedding(
      imageFile.buffer,
    );

    if (!embedding) {
      throw new BadRequestException(
        'No valid face detected in image. Please upload a clear photo with exactly one face.',
      );
    }

    // Encrypt the facial embedding before storing
    const encryptedEmbedding = this.encryptionService.encrypt(embedding);

    const { imagePath, imageUrl } = await this.processAndSaveImage(imageFile);

    const sontaHead = this.sontaHeadRepository.create({
      ...createSontaHeadDto,
      profileImageUrl: imageUrl,
      profileImagePath: imagePath,
      facialEmbedding: encryptedEmbedding,
      status: createSontaHeadDto.status || SontaHeadStatus.ACTIVE,
    });

    return this.sontaHeadRepository.save(sontaHead);
  }

  async findAll(query: QuerySontaHeadDto): Promise<PaginatedResult<SontaHead>> {
    const { search, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sontaHeadRepository.createQueryBuilder('sontaHead');

    if (search) {
      queryBuilder.andWhere(
        '(sontaHead.name ILIKE :search OR sontaHead.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('sontaHead.status = :status', { status });
    }

    queryBuilder
      .orderBy('sontaHead.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<SontaHead> {
    const sontaHead = await this.sontaHeadRepository.findOne({ where: { id } });
    if (!sontaHead) {
      throw new NotFoundException('Sonta Head not found');
    }
    return sontaHead;
  }

  async findByPhone(phone: string): Promise<SontaHead | null> {
    return this.sontaHeadRepository.findOne({ where: { phone } });
  }

  async update(
    id: string,
    updateSontaHeadDto: UpdateSontaHeadDto,
    imageFile?: Express.Multer.File,
  ): Promise<SontaHead> {
    const sontaHead = await this.findOne(id);

    if (updateSontaHeadDto.phone && updateSontaHeadDto.phone !== sontaHead.phone) {
      const existingByPhone = await this.sontaHeadRepository.findOne({
        where: { phone: updateSontaHeadDto.phone },
      });
      if (existingByPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    if (imageFile) {
      // Extract new facial embedding
      const embedding = await this.facialRecognitionService.extractEmbedding(
        imageFile.buffer,
      );

      if (!embedding) {
        throw new BadRequestException(
          'No valid face detected in new image. Please upload a clear photo with exactly one face.',
        );
      }

      // Encrypt the new facial embedding
      const encryptedEmbedding = this.encryptionService.encrypt(embedding);

      // Delete old image if exists
      if (sontaHead.profileImagePath) {
        await this.deleteImageFile(sontaHead.profileImagePath);
      }

      const { imagePath, imageUrl } = await this.processAndSaveImage(imageFile);
      sontaHead.profileImageUrl = imageUrl;
      sontaHead.profileImagePath = imagePath;
      sontaHead.facialEmbedding = encryptedEmbedding;
    }

    Object.assign(sontaHead, updateSontaHeadDto);
    return this.sontaHeadRepository.save(sontaHead);
  }

  async remove(id: string): Promise<void> {
    const sontaHead = await this.findOne(id);

    // Delete image file
    if (sontaHead.profileImagePath) {
      await this.deleteImageFile(sontaHead.profileImagePath);
    }

    await this.sontaHeadRepository.remove(sontaHead);
  }

  async getActiveCount(): Promise<number> {
    return this.sontaHeadRepository.count({
      where: { status: SontaHeadStatus.ACTIVE },
    });
  }

  async getAllActive(): Promise<SontaHead[]> {
    return this.sontaHeadRepository.find({
      where: { status: SontaHeadStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  private async processAndSaveImage(
    file: Express.Multer.File,
  ): Promise<{ imagePath: string; imageUrl: string }> {
    // Process image with Sharp: auto-rotate based on EXIF, resize, convert to JPEG, optimize
    const processedBuffer = await sharp(file.buffer)
      .rotate() // Auto-rotate based on EXIF orientation metadata
      .resize(400, 400, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    if (this.cloudinaryService.isEnabled()) {
      // Upload to Cloudinary
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);

      const result = await this.cloudinaryService.uploadImage(processedBuffer, {
        folder: 'sonta-attendance/profiles',
        publicId: `profile-${timestamp}-${randomStr}`,
        format: 'jpg',
      });

      return {
        imagePath: result.publicId, // Store public_id for deletion
        imageUrl: result.secureUrl, // Full Cloudinary URL
      };
    } else {
      // Fallback to local storage
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const imagePath = path.join(this.uploadDir, filename);
      await fs.writeFile(imagePath, processedBuffer);
      const imageUrl = `/uploads/profiles/${filename}`;
      return { imagePath, imageUrl };
    }
  }

  private async deleteImageFile(imagePathOrPublicId: string): Promise<void> {
    if (!imagePathOrPublicId) return;

    // Determine if it's a Cloudinary public_id or local file path
    if (imagePathOrPublicId.startsWith('sonta-attendance/')) {
      // Cloudinary public_id
      await this.cloudinaryService.deleteImage(imagePathOrPublicId);
    } else {
      // Local file path - ignore ENOENT errors (file might not exist anymore)
      try {
        await fs.unlink(imagePathOrPublicId);
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          console.error('Failed to delete local image file:', error);
        }
        // Silently ignore ENOENT (file not found) - expected when migrating to Cloudinary
      }
    }
  }

  async updateFacialEmbedding(id: string, embedding: Buffer): Promise<void> {
    await this.sontaHeadRepository.update(id, {
      facialEmbedding: embedding,
    });
  }
}
