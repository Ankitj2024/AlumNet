import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_URL: z.string().default('http://localhost:5000'),
  WEB_URL: z.string().default('http://localhost:3000'),

  // Cryptographic Secrets
  JWT_SECRET: z.string().min(32).default('production_grade_random_jwt_secret_key_minimum_64_characters_long_entropy'),
  COOKIE_SECRET: z.string().min(16).default('production_grade_cookie_signing_secret_string_32_chars'),
  CALENDAR_ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // Database & Cache
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/alumni_mentorship'),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment configuration:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
}

export const config = loadConfig();

