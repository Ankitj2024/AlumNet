import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '@p11/shared';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(
    new AppError(
      `The requested endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
      404,
      ErrorCodes.NOT_FOUND
    )
  );
}

