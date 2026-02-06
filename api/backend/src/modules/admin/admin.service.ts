import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser, AdminRole } from './entities/admin-user.entity';
import { CreateAdminDto, UpdateAdminDto } from './dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
  ) {}

  async create(createAdminDto: CreateAdminDto): Promise<AdminUser> {
    const existingByEmail = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });
    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }

    const admin = this.adminRepository.create({
      email: createAdminDto.email,
      fullName: createAdminDto.fullName,
      role: createAdminDto.role || AdminRole.ADMIN,
    });

    return this.adminRepository.save(admin);
  }

  async findAll(): Promise<AdminUser[]> {
    return this.adminRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AdminUser> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<AdminUser> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingByEmail = await this.adminRepository.findOne({
        where: { email: updateAdminDto.email },
      });
      if (existingByEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(admin, updateAdminDto);
    return this.adminRepository.save(admin);
  }

  async remove(id: string): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    await this.adminRepository.remove(admin);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.adminRepository.update(id, { lastLoginAt: new Date() });
  }
}
