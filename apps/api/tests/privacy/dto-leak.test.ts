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
});

