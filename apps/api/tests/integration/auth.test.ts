import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';

describe('Authentication & User Management Integration Tests', () => {
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

  it('should successfully register a student with valid password and return HTTP-only cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'alex.smith@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Alex',
        lastName: 'Smith',
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alex.smith@university.edu');
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never returned

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=/);
    expect(cookies[0]).toMatch(/HttpOnly/);
  });

  it('should reject registration when password does not meet security criteria', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'weak.pass@university.edu',
        password: 'simple', // Missing length, uppercase, numbers, special characters
        firstName: 'Weak',
        lastName: 'User',
        role: 'STUDENT',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject duplicate email registration with 409 Conflict', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'duplicate@university.edu',
        password: 'ValidPassword123!',
        firstName: 'First',
        lastName: 'User',
        role: 'STUDENT',
      });

    const duplicateRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'duplicate@university.edu',
        password: 'AnotherPassword123!',
        firstName: 'Second',
        lastName: 'User',
        role: 'ALUMNI_MENTOR',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.code).toBe('CONFLICT');
  });

  it('should successfully login an existing user and retrieve session via /me', async () => {
    // 1. Register user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'mentor.jane@alumni.edu',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'ALUMNI_MENTOR',
      });

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'mentor.jane@alumni.edu',
        password: 'SecurePassword123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);

    const tokenCookie = loginRes.headers['set-cookie'];

    // 3. Query /me using cookie
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', tokenCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('mentor.jane@alumni.edu');
    expect(meRes.body.data.role).toBe('ALUMNI_MENTOR');
  });
});

