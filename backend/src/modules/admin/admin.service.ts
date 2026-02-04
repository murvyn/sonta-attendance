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
    const existingByUsername = await this.adminRepository.findOne({
      where: { username: createAdminDto.username },
    });
    if (existingByUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingByEmail = await this.adminRepository.findOne({
      where: { email: createAdminDto.email },
    });
    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }

    const admin = this.adminRepository.create({
      username: createAdminDto.username,
      email: createAdminDto.email,
      password: createAdminDto.password,
      fullName: createAdminDto.fullName,
      role: createAdminDto.role || AdminRole.ADMIN,
    });

    const saved = await this.adminRepository.save(admin);
    return this.sanitizeAdmin(saved);
  }

  async findAll(): Promise<AdminUser[]> {
    const admins = await this.adminRepository.find({
      order: { createdAt: 'DESC' },
    });
    return admins.map((admin) => this.sanitizeAdmin(admin));
  }

  async findOne(id: string): Promise<AdminUser> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return this.sanitizeAdmin(admin);
  }

  async findByUsername(username: string): Promise<AdminUser | null> {
    return this.adminRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<AdminUser> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (updateAdminDto.username && updateAdminDto.username !== admin.username) {
      const existingByUsername = await this.adminRepository.findOne({
        where: { username: updateAdminDto.username },
      });
      if (existingByUsername) {
        throw new ConflictException('Username already exists');
      }
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
    const updated = await this.adminRepository.save(admin);
    return this.sanitizeAdmin(updated);
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

  private sanitizeAdmin(admin: AdminUser): AdminUser {
    const { passwordHash, ...sanitized } = admin;
    return sanitized as AdminUser;
  }
}
