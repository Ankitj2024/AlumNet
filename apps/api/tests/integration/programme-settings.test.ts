import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { programmeSettingsService } from '../../src/services/programmeSettings.service.js';
import { UserModel } from '../../src/models/User.model.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Task 2: Config-Driven Policy & ProgrammeSettings Integration Tests', () => {
  const app = createApp();
  let adminToken: string;
  let officerToken: string;
  let studentToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    programmeSettingsService.invalidateCache();

    // 1. Create Super Admin
    const adminPassHash = await hashPassword('AdminPassword123!');
    const adminUser = await UserModel.create({
      email: 'superadmin.policy@university.edu',
      passwordHash: adminPassHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      failedLoginAttempts: 0,
    });
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin.policy@university.edu', password: 'AdminPassword123!' });
    adminToken = adminLoginRes.body.data.token;

    // 2. Create Officer
    const officerPassHash = await hashPassword('OfficerPassword123!');
    const officerUser = await UserModel.create({
      email: 'officer.policy@university.edu',
      passwordHash: officerPassHash,
      firstName: 'Relations',
      lastName: 'Officer',
      role: 'ALUMNI_RELATIONS_OFFICER',
      status: 'ACTIVE',
      isEmailVerified: true,
      failedLoginAttempts: 0,
    });
    const officerLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.policy@university.edu', password: 'OfficerPassword123!' });
    officerToken = officerLoginRes.body.data.token;

    // 3. Create Student
    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student.policy@university.edu',
        password: 'StudentPassword123!',
        firstName: 'Test',
        lastName: 'Student',
        role: 'STUDENT',
      });
    studentToken = studentRes.body.data.token;
  });

  it('should allow officer to fetch baseline programme policy settings', async () => {
    const res = await request(app)
      .get('/api/v1/programme-settings')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matchingWeights).toBeDefined();
    expect(res.body.data.requestLimits.maxPendingRequestsPerStudent).toBe(3);
    expect(res.body.data.capacityBounds.maxMentorCapacity).toBe(10);
  });

  it('should allow Super Admin to update matching weights when they sum exactly to 1.0', async () => {
    const newWeights = {
      expertiseWeight: 0.35,
      roleWeight: 0.25,
      industryWeight: 0.20,
      mentoringInterestWeight: 0.10,
      availabilityWeight: 0.10, // Sum = 1.00
    };

    const res = await request(app)
      .put('/api/v1/programme-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matchingWeights: newWeights,
        reason: 'Fall 2026 calibration for role focus',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matchingWeights.roleWeight).toBe(0.25);
    expect(res.body.data.version).toBeGreaterThan(1);
    expect(res.body.data.changeHistory.length).toBeGreaterThan(0);
    expect(res.body.data.changeHistory[0].reason).toContain('Fall 2026 calibration');
  });

  it('should reject matching weights that do NOT sum to 1.0 with 400 Validation Error', async () => {
    const invalidWeights = {
      expertiseWeight: 0.50,
      roleWeight: 0.30,
      industryWeight: 0.30, // Sum = 1.30!
      mentoringInterestWeight: 0.10,
      availabilityWeight: 0.10,
    };

    const res = await request(app)
      .put('/api/v1/programme-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        matchingWeights: invalidWeights,
        reason: 'Invalid weight sum test',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('must sum exactly to 1.0');
  });

  it('should reject non-super-admin from updating programme policy with 403 Forbidden', async () => {
    const res = await request(app)
      .put('/api/v1/programme-settings')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        requestLimits: {
          maxPendingRequestsPerStudent: 4,
          maxRequestsPerRollingPeriod: 6,
          rollingPeriodDays: 7,
          requestExpiryDays: 7,
        },
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should serve cached settings and invalidate immediately after update', async () => {
    const initial = await programmeSettingsService.getSettings();
    const secondCall = await programmeSettingsService.getSettings();
    expect(initial).toBe(secondCall); // In-memory reference equality from cache

    // Update settings
    await request(app)
      .put('/api/v1/programme-settings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        capacityBounds: {
          minMentorCapacity: 2,
          maxMentorCapacity: 8,
        },
        reason: 'Updated capacity bounds',
      });

    const refreshed = await programmeSettingsService.getSettings();
    expect(refreshed.capacityBounds.maxMentorCapacity).toBe(8);
  });
});
