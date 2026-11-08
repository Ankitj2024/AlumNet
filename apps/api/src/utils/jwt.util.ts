import jwt from 'jsonwebtoken';
import { config } from '@p11/config';
import { UserRole } from '@p11/types';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export function generateToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
}

