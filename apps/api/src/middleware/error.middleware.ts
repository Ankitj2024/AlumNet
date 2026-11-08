import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes, createErrorResponse } from '@p11/shared';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || ErrorCodes.INTERNAL_ERROR;
  let message = err.message || 'An unexpected internal server error occurred.';
  let details = err.details || undefined;

  // Handle ZodError directly if not wrapped
  if (err?.name === 'ZodError') {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    message = 'Validation error occurred';
    details = (err.errors || []).map((e: any) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = ErrorCodes.CONFLICT;
    const fields = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate resource error: A record with this ${fields} already exists.`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ErrorCodes.BAD_REQUEST;
    message = `Invalid identifier format: ${err.value}`;
  }

  if (statusCode >= 500) {
    logger.error(`[Unhandled Server Error] ${req.method} ${req.originalUrl}:`, err);
  } else {
    logger.debug(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json(createErrorResponse(errorCode, message, details));
}
