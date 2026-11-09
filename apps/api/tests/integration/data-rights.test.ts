import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup';
import { UserModel } from '../../src/models/User.model';
import { AlumnusModel } from '../../src/models/Alumnus.model';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model';
import { MentorshipModel } from '../../src/models/Mentorship.model';
import { MessageModel } from '../../src/models/Message.model';
import { RefreshTokenModel } from '../../src/models/RefreshToken.model';
import { AuditLogModel } from '../../src/models/AuditLog.model';
import { hashPassword } from '../../src/utils/password.util';
import { ManualClock, purgeDeletedAccountsJob } from '../../src/jobs/backgroundJobs';
import { encryptMessage } from '../../src/utils/crypto.util';
import { Types } from 'mongoose';

describe('Task 8: GDPR / DPDP Data Rights, Portability Export & Soft-Delete Retention Tests', () => {
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

  it('should export a complete, machine-readable JSON bundle of all personal data (GDPR Art 20 / DPDP)', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.gdpr@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'GDPR',
      lastName: 'Student',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.gdpr@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'GDPR',
      lastName: 'Mentor',
      status: 'ACTIVE',
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    // Seed an encrypted message sent by the student
    const { encryptedContent, iv, authTag } = encryptMessage('My private portable message data');
    await MessageModel.create({
      mentorshipId: mentorship._id,
      senderId: student._id,
      content: '[CONTACT DETAIL REDACTED]',
      encryptedContent,
      iv,
      authTag,
      isRedacted: true,
      detectedTypes: ['EMAIL'],
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.gdpr@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    // Call export endpoint
    const exportRes = await request(app)
      .get('/api/v1/users/export')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(exportRes.status).toBe(200);
    expect(exportRes.headers['content-type']).toContain('application/json');
    expect(exportRes.headers['content-disposition']).toContain('attachment; filename="user-data-export-');

    const bundle = exportRes.body.data;
    expect(bundle.metadata.regulationCompliance).toContain('GDPR Article 20 (Right to Data Portability)');
    expect(bundle.user.email).toBe('student.gdpr@univ.edu');
    expect(bundle.user.passwordHash).toBeUndefined(); // Strictly excluded for security

    // Verify messages portability: sent messages must contain decrypted content for personal port
    expect(bundle.sentMessages).toHaveLength(1);
    expect(bundle.sentMessages[0].content).toBe('My private portable message data');
  });

  it('should soft-delete account, revoke sessions, pause mentor capacity, and schedule 30-day purge', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const mentor = await UserModel.create({
      email: 'mentor.softdel@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Soft',
      lastName: 'Delete',
      status: 'ACTIVE',
    });

    const alumnus = await AlumnusModel.create({
      userId: mentor._id,
      institutionalId: 'ALUM-DEL-001',
      graduationYear: 2020,
      academicDepartment: 'Computer Science',
      degree: 'B.Tech',
      professionalDesignation: 'Staff Engineer',
      organisation: 'TechCorp',
      industry: 'Software',
      yearsOfExperience: 6,
      professionalSummary: 'Summary',
      expertiseTags: ['Node.js'],
      mentoringTopics: ['System Design'],
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });

    await MentorCapacityModel.create({
      mentorId: alumnus._id,
      maxActiveMentees: 3,
      currentActiveMentees: 1,
      isPaused: false,
    });

    // Create a mock active refresh token
    await RefreshTokenModel.create({
      tokenHash: 'mock-refresh-token-active-hash',
      userId: mentor._id,
      familyId: 'family-001',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mentor.softdel@alumni.edu', password: 'SecurePass123!' });
    const mentorToken = loginRes.body.data.token;

    // Delete account
    const deleteRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.message).toContain('scheduled for permanent erasure in 30 days');
    expect(deleteRes.body.data.purgeScheduledAt).toBeDefined();

    // 1. Verify user status is DELETED in database
    const updatedUser = await UserModel.findById(mentor._id);
    expect(updatedUser?.status).toBe('DELETED');
    expect(updatedUser?.deletedAt).toBeDefined();
    expect(updatedUser?.purgeScheduledAt).toBeDefined();

    // 2. Verify all active refresh tokens revoked
    const remainingTokens = await RefreshTokenModel.find({ userId: mentor._id });
    expect(remainingTokens).toHaveLength(0);

    // 3. Verify mentor capacity paused and profile unsearchable
    const updatedCapacity = await MentorCapacityModel.findOne({ mentorId: alumnus._id });
    expect(updatedCapacity?.isPaused).toBe(true);

    const updatedAlumnus = await AlumnusModel.findOne({ userId: mentor._id });
    expect(updatedAlumnus?.isSearchable).toBe(false);

    // 4. Verify audit log entry
    const audit = await AuditLogModel.findOne({
      actorId: mentor._id,
      action: 'ACCOUNT_DELETION_SCHEDULED',
    });
    expect(audit).toBeDefined();
  });

  it('should support cancellation of deletion within the 30-day grace period', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const user = await UserModel.create({
      email: 'user.restore@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Restore',
      lastName: 'Me',
      status: 'DELETED',
      deletedAt: new Date(),
      purgeScheduledAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    });

    // In a test setup, we simulate authenticated request to cancel deletion
    const { dataRightsService } = await import('../../src/services/dataRights.service');
    const result = await dataRightsService.cancelAccountDeletion(user._id.toString());

    expect(result.status).toBe('ACTIVE');
    expect(result.message).toContain('Account deletion has been cancelled');

    const restoredUser = await UserModel.findById(user._id);
    expect(restoredUser?.status).toBe('ACTIVE');
    expect(restoredUser?.deletedAt).toBeUndefined();
    expect(restoredUser?.purgeScheduledAt).toBeUndefined();
  });

  it('should permanently purge and anonymize accounts past the 30-day schedule using background purge job', async () => {
    const initialTime = new Date('2026-11-10T12:00:00.000Z');
    const clock = new ManualClock(initialTime);

    const passwordHash = await hashPassword('SecurePass123!');

    // User A: Soft deleted 10 days ago (still has 20 days grace left)
    const userA = await UserModel.create({
      email: 'user.pending.grace@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Grace',
      lastName: 'Pending',
      status: 'DELETED',
      deletedAt: new Date('2026-10-31T12:00:00.000Z'),
      purgeScheduledAt: new Date('2026-11-30T12:00:00.000Z'), // Future relative to initialTime
    });

    // User B: Soft deleted 32 days ago (purge deadline passed 2 days ago)
    const userB = await UserModel.create({
      email: 'user.expired.purge@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Expired',
      lastName: 'PurgeTarget',
      status: 'DELETED',
      deletedAt: new Date('2026-10-09T12:00:00.000Z'),
      purgeScheduledAt: new Date('2026-11-08T12:00:00.000Z'), // Past relative to initialTime
    });

    // Run purge job at initialTime (Day 0)
    const run1 = await purgeDeletedAccountsJob(clock);
    expect(run1.purgedCount).toBe(1);

    // User A should NOT be purged
    const checkA = await UserModel.findById(userA._id);
    expect(checkA?.status).toBe('DELETED');
    expect(checkA?.email).toBe('user.pending.grace@univ.edu');

    // User B MUST be permanently anonymized
    const checkB = await UserModel.findById(userB._id);
    expect(checkB?.status).toBe('DEACTIVATED');
    expect(checkB?.firstName).toBe('Deleted');
    expect(checkB?.lastName).toBe('User');
    expect(checkB?.passwordHash).toBe('PURGED');
    expect(checkB?.email).toContain('anonymized-');

    // Advance clock by 25 days: User A's purge schedule has now arrived
    clock.advanceDays(25);
    const run2 = await purgeDeletedAccountsJob(clock);
    expect(run2.purgedCount).toBe(1);

    // User A is now permanently anonymized
    const finalA = await UserModel.findById(userA._id);
    expect(finalA?.status).toBe('DEACTIVATED');
    expect(finalA?.firstName).toBe('Deleted');
    expect(finalA?.passwordHash).toBe('PURGED');
  });
});
