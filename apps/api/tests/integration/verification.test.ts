import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { InstitutionalAlumniRecordModel } from '../../src/models/InstitutionalAlumniRecord.model.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Alumni Identity Verification Integration Tests', () => {
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

  it('should automatically verify alumnus when submitted credentials match institutional record', async () => {
    // 1. Seed verified institutional registrar record
    await InstitutionalAlumniRecordModel.create({
      institutionalAlumniId: 'ALUM-2022-CS-001',
      legalFullName: 'David Miller',
      graduationYear: 2022,
      academicDepartment: 'Computer Science',
      degreeAwarded: 'B.Tech Computer Science',
      source: 'REGISTRAR_ERP_SYNC',
    });

    // 2. Register alumnus
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'david.miller@alumni.edu',
        password: 'SecurePassword123!',
        firstName: 'David',
        lastName: 'Miller',
        role: 'ALUMNI_MENTOR',
      });

    const alumnusCookie = regRes.headers['set-cookie'];

    // 3. Submit matching verification details
    const submitRes = await request(app)
      .post('/api/v1/alumni/verification/submit')
      .set('Cookie', alumnusCookie)
      .send({
        submittedAlumniId: 'ALUM-2022-CS-001',
        graduationYear: 2022,
        academicDepartment: 'Computer Science',
        degree: 'B.Tech Computer Science',
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('VERIFIED');
    expect(submitRes.body.data.verificationMethod).toBe('INSTITUTIONAL_ERP_MATCH');

    // 4. Verify Alumnus status is updated
    const statusRes = await request(app)
      .get('/api/v1/alumni/verification/status')
      .set('Cookie', alumnusCookie);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.alumnus.verificationStatus).toBe('VERIFIED');
    expect(statusRes.body.data.alumnus.isSearchable).toBe(true);
  });

  it('should support manual review workflow by Alumni Relations Officer when no ERP record matches', async () => {
    // 1. Create Officer account
    const officerPass = await hashPassword('OfficerPass123!');
    await UserModel.create({
      email: 'officer@university.edu',
      passwordHash: officerPass,
      firstName: 'Officer',
      lastName: 'One',
      role: 'ALUMNI_RELATIONS_OFFICER',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer@university.edu', password: 'OfficerPass123!' });
    const officerCookie = officerLogin.headers['set-cookie'];

    // 2. Register alumnus without pre-existing institutional record
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'emily.watson@alumni.edu',
        password: 'SecurePassword123!',
        firstName: 'Emily',
        lastName: 'Watson',
        role: 'ALUMNI_MENTOR',
      });
    const alumnusCookie = regRes.headers['set-cookie'];

    // 3. Alumnus submits verification request
    const submitRes = await request(app)
      .post('/api/v1/alumni/verification/submit')
      .set('Cookie', alumnusCookie)
      .send({
        submittedAlumniId: 'ALUM-MANUAL-999',
        graduationYear: 2020,
        academicDepartment: 'Mechanical Engineering',
        degree: 'B.E. Mechanical',
      });

    expect(submitRes.body.data.status).toBe('PENDING');
    const requestId = submitRes.body.data._id;

    // 4. Officer reviews and approves request
    const reviewRes = await request(app)
      .post(`/api/v1/alumni/verification/${requestId}/review`)
      .set('Cookie', officerCookie)
      .send({
        status: 'VERIFIED',
        reviewNotes: 'Verified against departmental alumni archives.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('VERIFIED');
    expect(reviewRes.body.data.reviewNotes).toBe('Verified against departmental alumni archives.');
  });

  it('should allow officer to batch import registrar CSV records', async () => {
    // Create Officer account
    const officerPass = await hashPassword('OfficerPass123!');
    await UserModel.create({
      email: 'officer.import@university.edu',
      passwordHash: officerPass,
      firstName: 'Import',
      lastName: 'Officer',
      role: 'ALUMNI_RELATIONS_OFFICER',
      status: 'ACTIVE',
    });

    const officerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'officer.import@university.edu', password: 'OfficerPass123!' });
    const officerCookie = officerLogin.headers['set-cookie'];

    const csvContent = `institutionalAlumniId,legalFullName,graduationYear,academicDepartment,degreeAwarded,officialEmail
ALUM-2023-EE-001,Priya Sharma,2023,Electrical Engineering,B.Tech EE,priya.s@alumni.edu
ALUM-2023-EE-002,Rahul Verma,2023,Electrical Engineering,B.Tech EE,rahul.v@alumni.edu`;

    const importRes = await request(app)
      .post('/api/v1/alumni/verification/batch-import')
      .set('Cookie', officerCookie)
      .send({ csvContent });

    expect(importRes.status).toBe(200);
    expect(importRes.body.data.importedCount).toBe(2);

    const checkRecord = await InstitutionalAlumniRecordModel.findOne({
      institutionalAlumniId: 'ALUM-2023-EE-001',
    });
    expect(checkRecord).toBeDefined();
    expect(checkRecord?.legalFullName).toBe('Priya Sharma');
  });
});

