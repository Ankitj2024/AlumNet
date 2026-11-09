import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace roots if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const booleanString = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    return val.toLowerCase() === 'true' || val === '1';
  });

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    API_URL: z.string().default('http://localhost:5000'),
    WEB_URL: z.string().default('http://localhost:3000'),
    CORS_ALLOWED_ORIGINS: z
      .string()
      .default('http://localhost:3000,http://127.0.0.1:3000')
      .transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),

    // Demo Mode Gating
    ENABLE_DEMO_LOGIN: booleanString.default(false),

    // Cryptographic Secrets
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters long')
      .default('production_grade_random_jwt_secret_key_minimum_64_characters_long_entropy'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long')
      .default('production_grade_random_jwt_refresh_secret_key_minimum_64_characters_long_entropy'),
    COOKIE_SECRET: z
      .string()
      .min(16, 'COOKIE_SECRET must be at least 16 characters long')
      .default('production_grade_cookie_signing_secret_string_32_chars'),
    CALENDAR_ENCRYPTION_KEY: z
      .string()
      .length(64, 'CALENDAR_ENCRYPTION_KEY must be a 64-character (32-byte) hex string')
      .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    MESSAGE_ENCRYPTION_KEY: z
      .string()
      .length(64, 'MESSAGE_ENCRYPTION_KEY must be a 64-character (32-byte) hex string')
      .default('fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'),

    // Database & Cache
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/alumni_mentorship'),
    REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

    // Storage
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_PATH: z.string().default('./uploads'),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

    // Google Meet / Calendar Integration
    MEET_PROVIDER: z.enum(['google', 'mock']).default('mock'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.string().optional(),

    // Email / Notifications
    EMAIL_DRIVER: z.enum(['nodemailer', 'mailpit', 'mock']).default('mailpit'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().default(1025),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('AlumNet Mentorship <no-reply@alumni.edu>'),
  })
  .refine(
    (data) => {
      // In production, ENABLE_DEMO_LOGIN must never be true
      if (data.NODE_ENV === 'production' && data.ENABLE_DEMO_LOGIN === true) {
        return false;
      }
      return true;
    },
    {
      message:
        'FATAL CONFIGURATION ERROR: ENABLE_DEMO_LOGIN cannot be enabled when NODE_ENV is "production". Production boot aborted.',
      path: ['ENABLE_DEMO_LOGIN'],
    }
  )
  .refine(
    (data) => {
      // In production, fail-fast if default development secrets are used
      if (data.NODE_ENV === 'production') {
        if (
          data.JWT_SECRET.includes('production_grade_random_jwt_secret_key_minimum_64_characters') ||
          data.JWT_SECRET.includes('dev_jwt_secret')
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'FATAL CONFIGURATION ERROR: Default development JWT_SECRET cannot be used in production.',
      path: ['JWT_SECRET'],
    }
  );

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('================================================================');
    console.error('FATAL: Environment validation failed with the following errors:');
    console.error(JSON.stringify(formatted, null, 2));
    console.error('================================================================');
    throw new Error(`Environment validation failed: ${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

export const env = validateEnv();
