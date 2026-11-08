import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@p11/types';
import { AppError, ErrorCodes } from '@p11/shared';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError('Authentication required prior to role verification.', 401, ErrorCodes.UNAUTHORIZED)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden. Role '${req.user.role}' lacks necessary permissions for this resource.`,
          403,
          ErrorCodes.FORBIDDEN
        )
      );
    }

    next();
  };
}

