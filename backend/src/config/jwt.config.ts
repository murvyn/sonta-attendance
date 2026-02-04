import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  accessExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION || '3600', 10),
  refreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '7776000', 10),
}));
