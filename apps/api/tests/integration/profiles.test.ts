import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';

describe('Student & Mentor Profile Management Integration Tests', () => {
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

  it('should allow student to update career profile and compute completion score', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'priya.student@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'STUDENT',
      });
    const studentCookie = regRes.headers['set-cookie'];

    const updateRes = await request(app)
      .put('/api/v1/students/profile/me')
      .set('Cookie', studentCookie)
      .send({
        institutionalStudentId: 'STU-2024-001',
        academicProgramme: 'B.Tech',
        department: 'Computer Science',
        expectedGraduationYear: 2026,
        skills: ['TypeScript', 'React', 'MongoDB'],
        targetJobRoles: ['Full Stack Engineer', 'Software Developer'],
        preferredIndustries: ['FinTech', 'EdTech'],
        preferredCommunicationFrequency: 'BIWEEKLY',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.profileCompletionScore).toBeGreaterThanOrEqual(80);
    expect(updateRes.body.data.skills).toContain('TypeScript');
  });

  it('should allow mentor to update professional profile and configure mentee capacity', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'alumnus.kevin@alumni.edu',
        password: 'SecurePassword123!',
        firstName: 'Kevin',
        lastName: 'Gao',
        role: 'ALUMNI_MENTOR',
      });
    const mentorCookie = regRes.headers['set-cookie'];

    // Update profile
    const profileRes = await request(app)
      .put('/api/v1/alumni/profile/me')
      .set('Cookie', mentorCookie)
      .send({
        professionalDesignation: 'Staff Software Engineer',
        organisation: 'Enterprise Systems Inc',
        industry: 'Cloud Infrastructure',
        yearsOfExperience: 10,
        professionalSummary: 'Experienced engineering leader focusing on scalable distributed systems.',
        expertiseTags: ['Kubernetes', 'Go', 'System Architecture'],
        mentoringTopics: ['Staff Engineer Career Path', 'System Design Interviews'],
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.professionalDesignation).toBe('Staff Software Engineer');

    // Update capacity
    const capacityRes = await request(app)
      .put('/api/v1/alumni/capacity')
      .set('Cookie', mentorCookie)
      .send({
        maxActiveMentees: 4,
        isAcceptingRequests: true,
        isPaused: false,
      });

    expect(capacityRes.status).toBe(200);
    expect(capacityRes.body.data.maxActiveMentees).toBe(4);
    expect(capacityRes.body.data.isAcceptingRequests).toBe(true);
  });
});

