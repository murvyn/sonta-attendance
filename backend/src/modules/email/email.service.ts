import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.fromEmail =
      this.configService.get<string>('email.fromEmail') ||
      'Sonta Head <noreply@example.com>';
  }

  async sendMagicLink(
    email: string,
    magicLinkUrl: string,
    expiryMinutes: number,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        'Resend API key not configured. Magic link would be sent to:',
        email,
      );
      this.logger.warn('Magic link URL:', magicLinkUrl);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Sign in to Sonta Head Attendance System',
        html: this.getMagicLinkTemplate(magicLinkUrl, expiryMinutes),
      });
      this.logger.log(`Magic link email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send magic link email to ${email}`, error);
      throw error;
    }
  }

  private getMagicLinkTemplate(url: string, expiryMinutes: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
        <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0;">Sonta Head Attendance</h1>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 32px 0;">Secure Sign-In Request</p>

            <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Click the button below to sign in to your admin account. This link will expire in <strong>${expiryMinutes} minutes</strong>.
            </p>

            <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Sign In
            </a>

            <p style="color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 32px 0 0 0;">
              If you didn't request this email, you can safely ignore it. Someone may have entered your email by mistake.
            </p>

            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">

            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
              This link can only be used once and expires in ${expiryMinutes} minutes for security.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
