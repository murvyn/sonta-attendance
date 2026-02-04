import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { LoginDto, ChangePasswordDto } from './dto';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPayload {
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const admin = await this.validateUser(loginDto.username, loginDto.password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.adminService.updateLastLogin(admin.id);

    const tokens = await this.generateTokens(admin);

    return {
      ...tokens,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }

  async validateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<AdminUser | null> {
    let admin = await this.adminService.findByUsername(usernameOrEmail);
    if (!admin) {
      admin = await this.adminService.findByEmail(usernameOrEmail);
    }

    if (admin && (await admin.validatePassword(password))) {
      return admin;
    }
    return null;
  }

  async generateTokens(admin: AdminUser): Promise<TokenPayload> {
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<number>('jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<number>('jwt.refreshExpiration'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const admin = await this.adminService.findOne(payload.sub);
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(admin as AdminUser);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const admin = await this.adminRepository.findOne({ where: { id: userId } });
    if (!admin) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await admin.validatePassword(
      changePasswordDto.currentPassword,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    admin.password = changePasswordDto.newPassword;
    await this.adminRepository.save(admin);
  }

  async getProfile(userId: string) {
    return this.adminService.findOne(userId);
  }
}
