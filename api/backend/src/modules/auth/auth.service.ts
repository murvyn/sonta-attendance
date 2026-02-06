import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { AdminService } from '../admin/admin.service';
import { MagicLinkRequestDto, MagicLinkVerifyDto } from './dto';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { EmailService } from '../email/email.service';

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPayload {
  user: {
    id: string;
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
    private readonly emailService: EmailService,
    @InjectRepository(AdminUser)
    private readonly adminRepository: Repository<AdminUser>,
    @InjectRepository(MagicLinkToken)
    private readonly magicLinkTokenRepository: Repository<MagicLinkToken>,
  ) {}

  async requestMagicLink(
    dto: MagicLinkRequestDto,
  ): Promise<{ message: string }> {
    const admin = await this.adminService.findByEmail(dto.email);

    // Always return same message to prevent email enumeration
    const successMessage =
      'If an account exists with this email, a magic link has been sent.';

    if (!admin || !admin.isActive) {
      return { message: successMessage };
    }

    // Invalidate any existing unused tokens for this user
    await this.magicLinkTokenRepository.update(
      { adminId: admin.id, isUsed: false },
      { isUsed: true },
    );

    // Generate secure token (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    const expiryMinutes =
      this.configService.get<number>('email.magicLinkExpiryMinutes') || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save token to database
    const magicLinkToken = this.magicLinkTokenRepository.create({
      token,
      adminId: admin.id,
      expiresAt,
    });
    await this.magicLinkTokenRepository.save(magicLinkToken);

    // Build magic link URL
    const frontendUrl = this.configService.get<string>('email.frontendUrl');
    const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;

    // Send email
    await this.emailService.sendMagicLink(admin.email, magicLinkUrl, expiryMinutes);

    return { message: successMessage };
  }

  async verifyMagicLink(dto: MagicLinkVerifyDto): Promise<AuthResponse> {
    const tokenRecord = await this.magicLinkTokenRepository.findOne({
      where: { token: dto.token },
      relations: ['admin'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (tokenRecord.isUsed) {
      throw new UnauthorizedException('This magic link has already been used');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('This magic link has expired');
    }

    if (!tokenRecord.admin || !tokenRecord.admin.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Mark token as used
    tokenRecord.isUsed = true;
    tokenRecord.usedAt = new Date();
    await this.magicLinkTokenRepository.save(tokenRecord);

    // Update last login
    await this.adminService.updateLastLogin(tokenRecord.admin.id);

    // Generate JWT tokens
    const tokens = await this.generateTokens(tokenRecord.admin);

    return {
      ...tokens,
      user: {
        id: tokenRecord.admin.id,
        email: tokenRecord.admin.email,
        fullName: tokenRecord.admin.fullName,
        role: tokenRecord.admin.role,
      },
    };
  }

  async generateTokens(admin: AdminUser): Promise<TokenPayload> {
    const payload = {
      sub: admin.id,
      email: admin.email,
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

  async getProfile(userId: string) {
    return this.adminService.findOne(userId);
  }

  // Cleanup expired tokens (can be called via cron job)
  async cleanupExpiredTokens(): Promise<void> {
    await this.magicLinkTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
