import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT,
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests. Please wait 15 minutes before requesting again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT,
});

export const requestCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Request quota exceeded. You can send at most 10 mentorship requests per hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT,
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'You are sending messages too quickly. Please pause for a moment.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest && !process.env.TEST_RATE_LIMIT,
});
