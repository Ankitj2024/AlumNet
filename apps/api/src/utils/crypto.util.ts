import crypto from 'crypto';
import { env } from '@p11/config';

function getMessageKey(): Buffer {
  const hex = env.MESSAGE_ENCRYPTION_KEY;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, 'hex');
  }
  // Fallback to scrypt key derivation if not 64 hex characters
  return crypto.scryptSync(hex || 'alumnet_secure_message_key_salt_123', 'alumnet_salt_2026', 32);
}

export function encryptMessage(plaintext: string): {
  encryptedContent: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', getMessageKey(), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return {
    encryptedContent: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptMessage(encryptedContent: string, ivHex: string, authTagHex: string): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getMessageKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
