import { ApiResponse, ApiErrorResponse } from '@p11/types';

// Standard Error Codes
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  THROTTLE_LIMIT_REACHED: 'THROTTLE_LIMIT_REACHED',
  UNVERIFIED_MENTOR: 'UNVERIFIED_MENTOR',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Array<{ field?: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
    details?: Array<{ field?: string; message: string }>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export * from './privacyFilter.js';

// PII Detection and Scrubbing Engine
// Multi-pass regex for emails, phone numbers, and external messaging links
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
// Formatted phone numbers (international, US, Indian, spaced, dashed, dotted)
const PHONE_REGEX =
  /(?:(?:\+?([1-9]\d{0,2})[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b)/g;
// Obfuscated email patterns: user [at] domain [dot] com
const OBFUSCATED_EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[A-Za-z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[A-Za-z]{2,}\b/gi;
// External chat links (wa.me, t.me, discord.gg, etc.)
const EXTERNAL_LINK_REGEX =
  /\b(?:https?:\/\/)?(?:wa\.me|t\.me|telegram\.me|discord\.gg|chat\.whatsapp\.com|linkedin\.com\/in)\/[^\s]+/gi;

export interface PIIScanResult {
  hasPII: boolean;
  detectedTypes: ('EMAIL' | 'PHONE' | 'OBFUSCATED_EMAIL' | 'EXTERNAL_LINK')[];
  cleanText: string;
}

export function scanAndMaskPII(input: string): PIIScanResult {
  if (!input) {
    return { hasPII: false, detectedTypes: [], cleanText: input };
  }

  const detectedTypes: ('EMAIL' | 'PHONE' | 'OBFUSCATED_EMAIL' | 'EXTERNAL_LINK')[] = [];
  let sanitized = input;

  if (EMAIL_REGEX.test(input)) {
    detectedTypes.push('EMAIL');
    sanitized = sanitized.replace(EMAIL_REGEX, '[CONTACT DETAIL REDACTED]');
  }

  if (OBFUSCATED_EMAIL_REGEX.test(input)) {
    detectedTypes.push('OBFUSCATED_EMAIL');
    sanitized = sanitized.replace(OBFUSCATED_EMAIL_REGEX, '[CONTACT DETAIL REDACTED]');
  }

  if (EXTERNAL_LINK_REGEX.test(input)) {
    detectedTypes.push('EXTERNAL_LINK');
    sanitized = sanitized.replace(EXTERNAL_LINK_REGEX, '[EXTERNAL LINK REDACTED]');
  }

  // Only apply phone regex if matching sequence has >= 7 digits to avoid masking small numbers
  sanitized = sanitized.replace(PHONE_REGEX, (match) => {
    const digitCount = match.replace(/\D/g, '').length;
    if (digitCount >= 7) {
      if (!detectedTypes.includes('PHONE')) detectedTypes.push('PHONE');
      return '[PHONE NUMBER REDACTED]';
    }
    return match;
  });

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    cleanText: sanitized,
  };
}

// API Response Helpers
export function createSuccessResponse<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number }
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Array<{ field?: string; message: string }>,
  requestId?: string
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      requestId,
    },
  };
}

// System Constants
export const PROGRAMME_DEFAULTS = {
  MAX_PENDING_REQUESTS_PER_STUDENT: 3,
  MAX_REQUESTS_PER_ROLLING_WINDOW: 5,
  ROLLING_WINDOW_DAYS: 7,
  REQUEST_EXPIRY_DAYS: 7,
  DEFAULT_MAX_MENTEES: 2,
  MAX_MENTEE_LIMIT: 10,
  MATCHING_WEIGHTS: {
    EXPERTISE: 40,
    ROLE: 20,
    INDUSTRY: 15,
    INTEREST: 10,
    AVAILABILITY: 15,
  },
  ENGAGEMENT_THRESHOLDS: {
    AT_RISK_DAYS: 14,
    DORMANT_DAYS: 28,
  },
} as const;

