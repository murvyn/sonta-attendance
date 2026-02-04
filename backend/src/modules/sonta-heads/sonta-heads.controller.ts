import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { SontaHeadsService } from './sonta-heads.service';
import { CreateSontaHeadDto, UpdateSontaHeadDto, QuerySontaHeadDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    return callback(
      new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed'),
      false,
    );
  }
  callback(null, true);
};

@ApiTags('sonta-heads')
@Controller('api/sonta-heads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SontaHeadsController {
  constructor(private readonly sontaHeadsService: SontaHeadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Create a new Sonta Head' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'phone', 'profileImage'],
      properties: {
        name: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+233201234567' },
        email: { type: 'string', example: 'john@example.com' },
        notes: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
        profileImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Sonta Head created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or missing profile image' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  create(
    @Body() createSontaHeadDto: CreateSontaHeadDto,
    @UploadedFile() profileImage: Express.Multer.File,
  ) {
    return this.sontaHeadsService.create(createSontaHeadDto, profileImage);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Sonta Heads with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of Sonta Heads' })
  findAll(@Query() query: QuerySontaHeadDto) {
    return this.sontaHeadsService.findAll(query);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get count of active Sonta Heads' })
  @ApiResponse({ status: 200, description: 'Count of active Sonta Heads' })
  async getActiveCount() {
    const count = await this.sontaHeadsService.getActiveCount();
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Sonta Head by ID' })
  @ApiResponse({ status: 200, description: 'Sonta Head details' })
  @ApiResponse({ status: 404, description: 'Sonta Head not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sontaHeadsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  @ApiOperation({ summary: 'Update Sonta Head' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        phone: { type: 'string', example: '+233201234567' },
        email: { type: 'string', example: 'john@example.com' },
        notes: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
        profileImage: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Sonta Head updated successfully' })
  @ApiResponse({ status: 404, description: 'Sonta Head not found' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSontaHeadDto: UpdateSontaHeadDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.sontaHeadsService.update(id, updateSontaHeadDto, profileImage);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Sonta Head' })
  @ApiResponse({ status: 204, description: 'Sonta Head deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sonta Head not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.sontaHeadsService.remove(id);
  }
}
