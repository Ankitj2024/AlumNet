import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '@p11/shared';
import { verifyToken, TokenPayload } from '../utils/jwt.util.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  // 1. Check cookies (preferred HTTP-only cookie)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('Authentication required. No session token provided.', 401, ErrorCodes.UNAUTHORIZED)
    );
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(
      new AppError('Invalid or expired authentication token.', 401, ErrorCodes.UNAUTHORIZED)
    );
  }
}

