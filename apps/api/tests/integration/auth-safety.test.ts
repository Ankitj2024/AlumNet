import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { envSchema } from '@p11/config';
import { RefreshTokenModel } from '../../src/models/RefreshToken.model.js';

describe('Task 1: Production Safety & Hardened Authentication Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('1. Environment Validation and Demo Gating Rules', () => {
    it('should refuse boot if NODE_ENV=production and ENABLE_DEMO_LOGIN=true', () => {
      const invalidEnv = {
        NODE_ENV: 'production',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/prod',
        JWT_SECRET: 'a_very_long_secure_custom_production_secret_key_123456789',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'another_very_long_secure_custom_production_refresh_key_123456789',
        JWT_REFRESH_EXPIRES_IN: '7d',
        COOKIE_SECRET: 'another_super_secret_cookie_key_value_123456789',
        WEB_URL: 'https://alumni.university.edu',
        ENABLE_DEMO_LOGIN: 'true',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ENABLE_DEMO_LOGIN cannot be enabled when NODE_ENV is "production"');
      }
    });

    it('should refuse boot if NODE_ENV=production and default secret is used', () => {
      const invalidEnv = {
        NODE_ENV: 'production',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/prod',
        JWT_SECRET: 'dev_jwt_secret_key_change_in_production_12345',
        COOKIE_SECRET: 'dev_cookie_secret_key_change_in_production_12345',
        WEB_URL: 'https://alumni.university.edu',
        ENABLE_DEMO_LOGIN: 'false',
      };

      const result = envSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Default development JWT_SECRET cannot be used in production');
      }
    });
  });

  describe('2. Login Lockout Policy (5 failures -> 30 min lockout)', () => {
    it('should lock user out after 5 consecutive failed login attempts', async () => {
      // 1. Create a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'lockout.target@university.edu',
          password: 'CorrectPassword123!',
          firstName: 'Lockout',
          lastName: 'Target',
          role: 'STUDENT',
        });

      // 2. Perform 4 failed login attempts (status 401)
      for (let i = 1; i <= 4; i++) {
        const failRes = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'lockout.target@university.edu',
            password: 'WrongPassword999!',
          });
        expect(failRes.status).toBe(401);
        expect(failRes.body.error.message).toContain(`${5 - i} attempts remaining`);
      }

      // 3. 5th failed attempt should trigger lockout (status 423)
      const fifthRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'lockout.target@university.edu',
          password: 'WrongPassword999!',
        });
      expect(fifthRes.status).toBe(423);
      expect(fifthRes.body.error.message).toContain('Account has been locked for 30 minutes');

      // 4. Even with the CORRECT password, immediate login is rejected with 423
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'lockout.target@university.edu',
          password: 'CorrectPassword123!',
        });
      expect(lockedRes.status).toBe(423);
      expect(lockedRes.body.error.message).toContain('Account is temporarily locked');
    });
  });

  describe('3. Refresh Token Rotation with Reuse Family Revocation', () => {
    it('should rotate refresh token and revoke family upon detecting reuse of an old token', async () => {
      // 1. Register a user
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'rotate.user@university.edu',
          password: 'ValidPassword123!',
          firstName: 'Rotate',
          lastName: 'User',
          role: 'STUDENT',
        });

      expect(regRes.status).toBe(201);
      const initialRefreshToken = regRes.body.data.refreshToken;
      expect(initialRefreshToken).toBeDefined();

      // 2. Rotate token using initial refresh token
      const rotateRes1 = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(rotateRes1.status).toBe(200);
      expect(rotateRes1.body.success).toBe(true);
      const secondRefreshToken = rotateRes1.body.data.refreshToken;
      expect(secondRefreshToken).toBeDefined();
      expect(secondRefreshToken).not.toBe(initialRefreshToken);

      // 3. REUSE ATTACK: Attempt to use the already-revoked initialRefreshToken again!
      const reuseAttackRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      // Reuse detection triggers: 401 Unauthorized + entire family revoked
      expect(reuseAttackRes.status).toBe(401);
      expect(reuseAttackRes.body.error.message).toContain('Invalid or reused refresh token');

      // 4. Verify that the legitimate secondRefreshToken is ALSO now revoked because the whole family was revoked
      const legitAttemptRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: secondRefreshToken });

      expect(legitAttemptRes.status).toBe(401);

      // Check in DB that all tokens in that family are marked isRevoked: true
      const familyTokens = await RefreshTokenModel.find({ isRevoked: true });
      expect(familyTokens.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4. Mongo Sanitize Middleware', () => {
    it('should strip $ keys from request body to prevent NoSQL query injection', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $gt: '' }, // NoSQL injection attempt
          password: 'Password123!',
        });

      // Sanitizer strips $gt so email becomes empty or string, causing standard validation error
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
