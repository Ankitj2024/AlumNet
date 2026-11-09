import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup';
import { UserModel } from '../../src/models/User.model';
import { MentorshipModel } from '../../src/models/Mentorship.model';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model';
import { MessageModel } from '../../src/models/Message.model';
import { SessionModel } from '../../src/models/Session.model';
import { AuditLogModel } from '../../src/models/AuditLog.model';
import { hashPassword } from '../../src/utils/password.util';
import { Types } from 'mongoose';

describe('Task 6: Privacy Shield V2 — End-to-End Integration Tests', () => {
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

  it('should encrypt original content using AES-256-GCM in MongoDB while returning redacted content to receiver', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.privacy@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Student',
      lastName: 'One',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.privacy@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Mentor',
      lastName: 'One',
      status: 'ACTIVE',
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    // Student logs in
    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.privacy@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    // Mentor logs in
    const mentorLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mentor.privacy@alumni.edu', password: 'SecurePass123!' });
    const mentorToken = mentorLogin.body.data.token;

    // Student sends message containing obfuscated email and phone
    const sendRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        content: 'Hey mentor! Reach me at alex.personal at gmail dot com or call +91 9876543210.',
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.isRedacted).toBe(true);
    expect(sendRes.body.data.senderWarning).toContain('Contact details detected and hidden');

    // 1. Verify in Mongo raw document: content is redacted, encryptedContent is ciphertext with iv and authTag
    const rawDoc = await MessageModel.findById(sendRes.body.data._id);
    expect(rawDoc).toBeDefined();
    expect(rawDoc?.content).toContain('[CONTACT DETAIL REDACTED]');
    expect(rawDoc?.content).toContain('[PHONE NUMBER REDACTED]');
    expect(rawDoc?.content).not.toContain('alex.personal at gmail dot com');
    expect(rawDoc?.content).not.toContain('9876543210');
    expect(rawDoc?.encryptedContent).toBeDefined();
    expect(rawDoc?.encryptedContent).not.toContain('alex.personal');
    expect(rawDoc?.iv).toBeDefined();
    expect(rawDoc?.iv.length).toBeGreaterThanOrEqual(24);
    expect(rawDoc?.authTag).toHaveLength(32); // 16 bytes hex

    // 2. Sender gets message list: sees original decrypted content + senderWarning
    const senderFetch = await request(app)
      .get(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(senderFetch.status).toBe(200);
    const senderMsg = senderFetch.body.data[0];
    expect(senderMsg.content).toContain('alex.personal at gmail dot com');
    expect(senderMsg.content).toContain('+91 9876543210');
    expect(senderMsg.senderWarning).toBeDefined();

    // 3. Receiver (Mentor) gets message list: sees strictly redacted text without warning
    const receiverFetch = await request(app)
      .get(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(receiverFetch.status).toBe(200);
    const receiverMsg = receiverFetch.body.data[0];
    expect(receiverMsg.content).toContain('[CONTACT DETAIL REDACTED]');
    expect(receiverMsg.content).toContain('[PHONE NUMBER REDACTED]');
    expect(receiverMsg.content).not.toContain('alex.personal at gmail dot com');
    expect(receiverMsg.content).not.toContain('9876543210');
  });

  it('should enforce progressive sanctions: 3 PII violations in 24h triggers 429 read-only mode for 24 hours', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.sanction@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Sanction',
      lastName: 'Student',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.sanction@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Mentor',
      lastName: 'Sanction',
      status: 'ACTIVE',
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.sanction@univ.edu', password: 'SecurePass123!' });
    const token = loginRes.body.data.token;

    // Violation 1
    const res1 = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Mail me at test1@gmail.com' });
    expect(res1.status).toBe(201);

    // Violation 2
    const res2 = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Call 9876543210' });
    expect(res2.status).toBe(201);

    // Violation 3
    const res3 = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Reach me on t.me/telegramuser' });
    expect(res3.status).toBe(201);

    // 4th message should be rejected with 429 Too Many Requests (read-only mode active)
    const res4 = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello mentor!' });

    expect(res4.status).toBe(429);
    expect(res4.body.error?.message || res4.body.message).toContain('read-only messaging mode for 24 hours');
  });

  it('should unlock mutual direct contact when pair has completed >= 3 sessions', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.unlock@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Unlock',
      lastName: 'Student',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.unlock@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Unlock',
      lastName: 'Mentor',
      status: 'ACTIVE',
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    // Create 3 COMPLETED sessions between this pair
    for (let i = 1; i <= 3; i++) {
      await SessionModel.create({
        mentorshipId: mentorship._id,
        scheduledStartTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        timeZone: 'UTC',
        status: 'COMPLETED',
        proposedBy: student._id,
      });
    }

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.unlock@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    // Post message containing email
    const sendRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        content: 'Since we completed 3 sessions, here is my direct email: student.direct@univ.edu',
      });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.isMutualContactUnlocked).toBe(true);
    expect(sendRes.body.data.isRedacted).toBe(false);
    expect(sendRes.body.data.content).toContain('student.direct@univ.edu');
  });

  it('should support moderation decryption endpoint: require OFFICER role and record audited justification', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.mod@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Student',
      lastName: 'Mod',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.mod@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Mentor',
      lastName: 'Mod',
      status: 'ACTIVE',
    });

    const officer = await UserModel.create({
      email: 'officer.mod@univ.edu',
      passwordHash,
      role: 'ALUMNI_RELATIONS_OFFICER',
      firstName: 'Officer',
      lastName: 'Mod',
      status: 'ACTIVE',
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.mod@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.mod@univ.edu', password: 'SecurePass123!' });
    const officerToken = officerLogin.body.data.token;

    // Student sends a message with phone number
    const sendRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Secret phone: +91 9998887776' });

    const messageId = sendRes.body.data._id;

    // 1. Student attempting moderation decryption should get 403 Forbidden
    const unauthRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages/${messageId}/moderation-decrypt`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Curious student' });

    expect(unauthRes.status).toBe(403);

    // 2. Officer without justification reason should get 400 Bad Request
    const noReasonRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages/${messageId}/moderation-decrypt`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ reason: '' });

    expect(noReasonRes.status).toBe(400);

    // 3. Officer with legitimate reason successfully decrypts and creates audit log
    const decryptRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages/${messageId}/moderation-decrypt`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ reason: 'Investigating reported harassment and off-platform solicitation' });

    expect(decryptRes.status).toBe(200);
    expect(decryptRes.body.data.decryptedContent).toBe('Secret phone: +91 9998887776');
    expect(decryptRes.body.data.justification).toBe(
      'Investigating reported harassment and off-platform solicitation'
    );

    // Verify audit log record
    const auditRecord = await AuditLogModel.findOne({
      action: 'SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION',
      actorId: officer._id,
    });
    expect(auditRecord).toBeDefined();
    expect(auditRecord?.entityId).toBe(messageId.toString());
    expect(auditRecord?.metadata?.reason).toBe(
      'Investigating reported harassment and off-platform solicitation'
    );
  });
});
