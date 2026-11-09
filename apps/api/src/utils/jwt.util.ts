import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@p11/config';
import { UserRole } from '@p11/types';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

/**
 * Access token expires in 15 minutes.
 * Maintained in-memory only on the client for production safety.
 */
export function generateAccessToken(payload: TokenPayload, expiresIn: string = '15m'): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresIn as any });
}

// Backwards-compatible alias default to 15m
export function generateToken(payload: TokenPayload, expiresIn: string = '15m'): string {
  return generateAccessToken(payload, expiresIn);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}

/**
 * High-entropy refresh token string
 */
export function generateRefreshTokenString(): string {
  return crypto.randomBytes(48).toString('hex');
}

/**
 * SHA-256 hash of refresh token for safe database persistence
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
