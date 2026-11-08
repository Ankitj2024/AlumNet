import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Role-Based Access Control (RBAC) Integration Tests', () => {
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

  it('should prevent student from accessing officer verification queue with 403 Forbidden', async () => {
    // 1. Register student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student.bob@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Bob',
        lastName: 'Student',
        role: 'STUDENT',
      });

    const studentCookie = regRes.headers['set-cookie'];

    // 2. Student attempts to access verification queue
    const queueRes = await request(app)
      .get('/api/v1/alumni/verification/queue')
      .set('Cookie', studentCookie);

    expect(queueRes.status).toBe(403);
    expect(queueRes.body.success).toBe(false);
    expect(queueRes.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow Alumni Relations Officer to access verification queue', async () => {
    // Seed officer
    const passwordHash = await hashPassword('OfficerPass123!');
    const officer = await UserModel.create({
      email: 'officer.carol@university.edu',
      passwordHash,
      firstName: 'Carol',
      lastName: 'Officer',
      role: 'ALUMNI_RELATIONS_OFFICER',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'officer.carol@university.edu',
        password: 'OfficerPass123!',
      });

    const officerCookie = loginRes.headers['set-cookie'];

    const queueRes = await request(app)
      .get('/api/v1/alumni/verification/queue')
      .set('Cookie', officerCookie);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.success).toBe(true);
    expect(Array.isArray(queueRes.body.data)).toBe(true);
  });

  it('should reject unauthenticated access to protected endpoints with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/alumni/profile/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

