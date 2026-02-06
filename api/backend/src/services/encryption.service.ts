import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('EMBEDDING_ENCRYPTION_KEY');

    if (!key || key.length < 32) {
      throw new Error(
        'EMBEDDING_ENCRYPTION_KEY must be at least 32 characters long',
      );
    }

    // Use first 32 bytes of the key
    this.encryptionKey = Buffer.from(key.slice(0, 32), 'utf8');
    this.logger.log('Encryption service initialized with AES-256-GCM');
  }

  /**
   * Encrypt facial embedding data
   * @param data - Float32Array face embedding (128D)
   * @returns Encrypted buffer with IV and auth tag prepended
   */
  encrypt(data: Float32Array): Buffer {
    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Convert Float32Array to Buffer
      const dataBuffer = Buffer.from(data.buffer);

      // Encrypt
      const encrypted = Buffer.concat([
        cipher.update(dataBuffer),
        cipher.final(),
      ]);

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: IV (12 bytes) + Auth Tag (16 bytes) + Encrypted Data
      const result = Buffer.concat([iv, authTag, encrypted]);

      this.logger.debug(
        `Encrypted embedding: ${result.length} bytes (IV: 12, Tag: 16, Data: ${encrypted.length})`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to encrypt embedding', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt facial embedding data
   * @param encryptedBuffer - Buffer containing IV + auth tag + encrypted data
   * @returns Float32Array face embedding (128D)
   */
  decrypt(encryptedBuffer: Buffer): Float32Array {
    try {
      // Extract components
      const iv = encryptedBuffer.slice(0, 12);
      const authTag = encryptedBuffer.slice(12, 28);
      const encrypted = encryptedBuffer.slice(28);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      // Convert Buffer back to Float32Array
      const float32Array = new Float32Array(
        decrypted.buffer,
        decrypted.byteOffset,
        decrypted.length / Float32Array.BYTES_PER_ELEMENT,
      );

      this.logger.debug(
        `Decrypted embedding: ${float32Array.length} dimensions`,
      );

      return float32Array;
    } catch (error) {
      this.logger.error('Failed to decrypt embedding', error);
      throw new Error('Decryption failed - data may be corrupted');
    }
  }

  /**
   * Encrypt a string (for other sensitive data if needed)
   */
  encryptString(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Return as base64: IV:AuthTag:Encrypted
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  /**
   * Decrypt a string
   */
  decryptString(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted string format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(authTag);

    return (
      decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8')
    );
  }
}
