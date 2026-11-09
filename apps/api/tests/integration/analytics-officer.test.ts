import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup';
import { UserModel } from '../../src/models/User.model';
import { MentorshipModel } from '../../src/models/Mentorship.model';
import { PlacementRecordModel } from '../../src/models/PlacementRecord.model';
import { MessageModel } from '../../src/models/Message.model';
import { AuditLogModel } from '../../src/models/AuditLog.model';
import { hashPassword } from '../../src/utils/password.util';
import { Types } from 'mongoose';

describe('Task 7: Officer Analytics, Placement Outcomes & Moderation Queue Integration Tests', () => {
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

  it('should return strictly aggregated overview metrics with zero student PII for authorized officers', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const officer = await UserModel.create({
      email: 'officer.analytics@univ.edu',
      passwordHash,
      role: 'ALUMNI_RELATIONS_OFFICER',
      firstName: 'Officer',
      lastName: 'Analytics',
      status: 'ACTIVE',
    });

    const student = await UserModel.create({
      email: 'student.private@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'PrivateStudent',
      lastName: 'Secret',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.analytics@univ.edu', password: 'SecurePass123!' });
    const officerToken = officerLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.private@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    // 1. Student attempting to access officer analytics gets 403 Forbidden
    const studentAccess = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentAccess.status).toBe(403);

    // 2. Officer accesses analytics: receives strictly aggregate metrics
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.participation.totalStudents).toBeGreaterThanOrEqual(1);
    expect(res.body.data.engagement).toBeDefined();

    // Verify zero PII leak: student name or email must never appear in response body
    const bodyString = JSON.stringify(res.body);
    expect(bodyString).not.toContain('student.private@univ.edu');
    expect(bodyString).not.toContain('PrivateStudent');
  });

  it('should support CSV export for overview and placement analytics with Content-Type text/csv', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const officer = await UserModel.create({
      email: 'officer.csv@univ.edu',
      passwordHash,
      role: 'ALUMNI_RELATIONS_OFFICER',
      firstName: 'Officer',
      lastName: 'Csv',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.csv@univ.edu', password: 'SecurePass123!' });
    const officerToken = officerLogin.body.data.token;

    // 1. Overview CSV Export
    const overviewCsvRes = await request(app)
      .get('/api/v1/analytics/overview/export')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(overviewCsvRes.status).toBe(200);
    expect(overviewCsvRes.headers['content-type']).toContain('text/csv');
    expect(overviewCsvRes.text).toContain('Metric Category');
    expect(overviewCsvRes.text).toContain('Total Students');
    expect(overviewCsvRes.text).toContain('Active Mentorship Relationships');

    // 2. Placement CSV Export via format query parameter
    const placementCsvRes = await request(app)
      .get('/api/v1/analytics/placement?format=csv')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(placementCsvRes.status).toBe(200);
    expect(placementCsvRes.headers['content-type']).toContain('text/csv');
    expect(placementCsvRes.text).toContain('Mentorship Impact');
    expect(placementCsvRes.text).toContain('Compensation Lift');
  });

  it('should allow student to self-report placement and auto-attribute mentorship', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const student = await UserModel.create({
      email: 'student.placed@univ.edu',
      passwordHash,
      role: 'STUDENT',
      firstName: 'Placed',
      lastName: 'Student',
      status: 'ACTIVE',
    });

    const mentor = await UserModel.create({
      email: 'mentor.placed@alumni.edu',
      passwordHash,
      role: 'ALUMNI_MENTOR',
      firstName: 'Mentor',
      lastName: 'Guide',
      status: 'ACTIVE',
    });

    // Create an active mentorship for the student
    await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.placed@univ.edu', password: 'SecurePass123!' });
    const studentToken = studentLogin.body.data.token;

    const reportRes = await request(app)
      .post('/api/v1/analytics/placements/self-report')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        company: 'Stripe',
        role: 'Full Stack Engineer',
        package: 2800000,
        currency: 'INR',
        notes: 'Mentorship on system design and interview mock rounds directly helped!',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.company).toBe('Stripe');
    expect(reportRes.body.data.role).toBe('Full Stack Engineer');
    expect(reportRes.body.data.package).toBe(2800000);
    expect(reportRes.body.data.mentorshipAttributed).toBe(true);

    const saved = await PlacementRecordModel.findById(reportRes.body.data._id);
    expect(saved).toBeDefined();
    expect(saved?.source).toBe('STUDENT_SELF_REPORT');
  });

  it('should allow officer to batch import registrar placement records', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const officer = await UserModel.create({
      email: 'officer.import@univ.edu',
      passwordHash,
      role: 'ALUMNI_RELATIONS_OFFICER',
      firstName: 'Officer',
      lastName: 'Importer',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.import@univ.edu', password: 'SecurePass123!' });
    const officerToken = officerLogin.body.data.token;

    const batchRes = await request(app)
      .post('/api/v1/analytics/placements/import')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        records: [
          {
            studentEmail: 'grad1@univ.edu',
            company: 'Google',
            role: 'Software Engineer',
            package: 3200000,
          },
          {
            studentEmail: 'grad2@univ.edu',
            company: 'Microsoft',
            role: 'Product Manager',
            package: 2600000,
          },
        ],
      });

    expect(batchRes.status).toBe(200);
    expect(batchRes.body.data.importedCount).toBe(2);

    const recordsInDb = await PlacementRecordModel.find({ source: 'REGISTRAR_IMPORT' });
    expect(recordsInDb).toHaveLength(2);
  });

  it('should allow officer to fetch moderation queue and view audit logs with filters', async () => {
    const passwordHash = await hashPassword('SecurePass123!');

    const officer = await UserModel.create({
      email: 'officer.queue@univ.edu',
      passwordHash,
      role: 'ALUMNI_RELATIONS_OFFICER',
      firstName: 'Officer',
      lastName: 'Queue',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.queue@univ.edu', password: 'SecurePass123!' });
    const officerToken = officerLogin.body.data.token;

    // Seed an audit log
    await AuditLogModel.create({
      actorId: officer._id,
      actorRole: 'ALUMNI_RELATIONS_OFFICER',
      action: 'SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION',
      entityType: 'Message',
      entityId: new Types.ObjectId().toString(),
      metadata: { reason: 'Test moderation audit reason' },
      timestamp: new Date(),
    });

    // 1. Fetch Audit Logs
    const auditRes = await request(app)
      .get('/api/v1/analytics/audit-logs?action=SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.logs.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.body.data.logs[0].action).toBe('SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION');

    // 2. Fetch Moderation Queue
    const modRes = await request(app)
      .get('/api/v1/analytics/moderation-queue')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(modRes.status).toBe(200);
    expect(modRes.body.data.pagination).toBeDefined();
  });
});
