import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  magicLinkExpiryMinutes: parseInt(
    process.env.MAGIC_LINK_EXPIRY_MINUTES || '10',
    10,
  ),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
}));
