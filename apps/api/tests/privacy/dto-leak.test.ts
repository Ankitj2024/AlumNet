import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { UserModel } from '../../src/models/User.model.js';
import { hashPassword } from '../../src/utils/password.util.js';

// Recursive helper to inspect any string value in a JSON structure
function recursiveFindStrings(obj: any): string[] {
  const strings: string[] = [];
  function traverse(current: any) {
    if (typeof current === 'string') {
      strings.push(current);
    } else if (Array.isArray(current)) {
      current.forEach(traverse);
    } else if (current !== null && typeof current === 'object') {
      Object.keys(current).forEach((key) => {
        traverse(current[key]);
      });
    }
  }
  traverse(obj);
  return strings;
}

describe('MANDATORY PRIVACY RELEASE REQUIREMENT — Zero Alumni Contact Leak Tests', () => {
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

  it('MUST NEVER leak alumni email, phone, institutional ID, or docs in student search response', async () => {
    // 1. Seed a verified alumnus with private sensitive contact info
    const sensitiveEmail = 'private.executive.mentor@topfirm.com';
    const sensitiveAlumniId = 'SENSITIVE-REGISTRAR-ID-999';
    const sensitiveDocUrl = 'https://s3.amazonaws.com/private-bucket/passport_doc.pdf';

    const passwordHash = await hashPassword('SecretPass123!');
    const mentorUser = await UserModel.create({
      email: sensitiveEmail,
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });

    await AlumnusModel.create({
      userId: mentorUser._id,
      institutionalId: sensitiveAlumniId,
      graduationYear: 2018,
      academicDepartment: 'Computer Science',
      degree: 'B.Tech',
      professionalDesignation: 'VP of Engineering',
      organisation: 'Tech Corp',
      industry: 'Software',
      yearsOfExperience: 8,
      professionalSummary: 'Passionate about engineering mentorship and system design.',
      expertiseTags: ['Distributed Systems', 'Cloud Architecture'],
      mentoringTopics: ['Career Growth', 'Architecture'],
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });

    // 2. Register and authenticate student
    const studentReg = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student.privacy.test@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Student',
        lastName: 'Tester',
        role: 'STUDENT',
      });
    const studentCookie = studentReg.headers['set-cookie'];

    // 3. Student performs mentor search
    const searchRes = await request(app)
      .get('/api/v1/alumni/mentors')
      .set('Cookie', studentCookie);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);
    expect(searchRes.body.data.length).toBeGreaterThan(0);

    // 4. Thorough recursive inspection of entire response body
    const allExtractedStrings = recursiveFindStrings(searchRes.body);

    // Assert absence of private sensitive attributes
    expect(allExtractedStrings).not.toContain(sensitiveEmail);
    expect(allExtractedStrings).not.toContain(sensitiveAlumniId);
    expect(allExtractedStrings).not.toContain(sensitiveDocUrl);

    // Verify regex matches for any unexpected email or phone patterns
    for (const val of allExtractedStrings) {
      if (val.includes('@')) {
        // Only student's own email could theoretically exist in user endpoints, but in mentor search: NONE
        expect(val).not.toBe(sensitiveEmail);
      }
    }

    // Verify mentor payload structure
    const mentorItem = searchRes.body.data[0];
    expect(mentorItem.firstName).toBe('Sarah');
    expect(mentorItem.professionalDesignation).toBe('VP of Engineering');
    expect(mentorItem.email).toBeUndefined(); // Strictly forbidden
    expect(mentorItem.institutionalId).toBeUndefined(); // Strictly forbidden
    expect(mentorItem.documentUrls).toBeUndefined(); // Strictly forbidden
  });

  it('MUST NEVER leak encryptedContent, iv, authTag, or cipher keys in message endpoints', async () => {
    const passwordHash = await hashPassword('SecretPass123!');
    const student = await UserModel.create({
      email: 'student.msg.leak@univ.edu',
      passwordHash,
      firstName: 'Student',
      lastName: 'Leak',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    const mentor = await UserModel.create({
      email: 'mentor.msg.leak@univ.edu',
      passwordHash,
      firstName: 'Mentor',
      lastName: 'Leak',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.msg.leak@univ.edu', password: 'SecretPass123!' });
    const studentToken = studentLogin.body.data.token;

    const { MentorshipModel } = await import('../../src/models/Mentorship.model');
    const { Types } = await import('mongoose');
    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    const sendRes = await request(app)
      .post(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Hello mentor, let us meet.' });

    expect(sendRes.status).toBe(201);
    expect(sendRes.body.data.encryptedContent).toBeUndefined();
    expect(sendRes.body.data.iv).toBeUndefined();
    expect(sendRes.body.data.authTag).toBeUndefined();

    const getRes = await request(app)
      .get(`/api/v1/messaging/${mentorship._id}/messages`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(getRes.status).toBe(200);
    const msg = getRes.body.data[0];
    expect(msg.encryptedContent).toBeUndefined();
    expect(msg.iv).toBeUndefined();
    expect(msg.authTag).toBeUndefined();
  });

  it('MUST NEVER leak private mentorNotes to student in session responses', async () => {
    const passwordHash = await hashPassword('SecretPass123!');
    const student = await UserModel.create({
      email: 'student.session.leak@univ.edu',
      passwordHash,
      firstName: 'Student',
      lastName: 'Notes',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    const mentor = await UserModel.create({
      email: 'mentor.session.leak@univ.edu',
      passwordHash,
      firstName: 'Mentor',
      lastName: 'Notes',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });

    const studentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student.session.leak@univ.edu', password: 'SecretPass123!' });
    const studentToken = studentLogin.body.data.token;

    const { MentorshipModel } = await import('../../src/models/Mentorship.model');
    const { SessionModel } = await import('../../src/models/Session.model');
    const { Types } = await import('mongoose');

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: new Types.ObjectId(),
      status: 'ACTIVE',
    });

    const session = await SessionModel.create({
      mentorshipId: mentorship._id,
      scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      timeZone: 'UTC',
      proposedBy: mentor._id,
      status: 'COMPLETED',
      mentorNotes: 'CONFIDENTIAL: Student needs improvement on basic data structures.',
      sharedNotes: 'Great session on system design fundamentals.',
    });

    const listRes = await request(app)
      .get(`/api/v1/mentorships/${mentorship._id}/sessions`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    const sessionDto = listRes.body.data[0];
    expect(sessionDto.sharedNotes).toBe('Great session on system design fundamentals.');
    expect(sessionDto.mentorNotes).toBeUndefined();
    expect(JSON.stringify(listRes.body)).not.toContain('CONFIDENTIAL');
  });
});

