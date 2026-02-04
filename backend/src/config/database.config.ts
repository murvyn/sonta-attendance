import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'sonta',
  password: process.env.DATABASE_PASSWORD || 'sonta_password',
  database: process.env.DATABASE_NAME || 'sonta_attendance',
}));
