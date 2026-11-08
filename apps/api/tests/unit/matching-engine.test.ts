import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { matchingEngineService } from '../../src/services/matchingEngine.service.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Intelligent Matching Engine & Explainable Match Cards', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should rank mentors by multi-factor relevance and return explainable match rationale', async () => {
    const passwordHash = await hashPassword('Secret123!');

    // 1. Create Student targeting "Cloud Architect" with skills ["AWS", "Docker", "Go"]
    const studentUser = await UserModel.create({
      email: 'student.match@university.edu',
      passwordHash,
      firstName: 'Maya',
      lastName: 'Lin',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    await StudentProfileModel.create({
      userId: studentUser._id,
      academicProgramme: 'B.Tech',
      department: 'Computer Science',
      skills: ['AWS', 'Docker', 'Go'],
      targetJobRoles: ['Cloud Architect', 'DevOps Engineer'],
      preferredIndustries: ['Cloud Infrastructure'],
    });

    // 2. Mentor A (High Match: Cloud Architect, AWS, Docker, Cloud Infrastructure)
    const mentorAUser = await UserModel.create({
      email: 'mentorA@alumni.edu',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Cloud',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });
    const mentorA = await AlumnusModel.create({
      userId: mentorAUser._id,
      professionalDesignation: 'Senior Cloud Architect',
      organisation: 'Cloud Corp',
      industry: 'Cloud Infrastructure',
      expertiseTags: ['AWS', 'Docker', 'Kubernetes', 'Go'],
      mentoringTopics: ['System Design', 'Interview Prep'],
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });
    await MentorCapacityModel.create({
      mentorId: mentorA._id,
      maxActiveMentees: 3,
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // 3. Mentor B (Low Match: UI Designer, Figma, Design)
    const mentorBUser = await UserModel.create({
      email: 'mentorB@alumni.edu',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Design',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });
    const mentorB = await AlumnusModel.create({
      userId: mentorBUser._id,
      professionalDesignation: 'Lead UI/UX Designer',
      organisation: 'Design Studio',
      industry: 'Creative Media',
      expertiseTags: ['Figma', 'UI Design', 'Typography'],
      mentoringTopics: ['Portfolio Review'],
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });
    await MentorCapacityModel.create({
      mentorId: mentorB._id,
      maxActiveMentees: 2,
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // 4. Compute recommendations
    const recommendations = await matchingEngineService.getRecommendationsForStudent(
      studentUser._id.toString()
    );

    expect(recommendations.length).toBe(2);

    // Mentor A must be ranked #1
    expect(recommendations[0].mentor.professionalDesignation).toBe('Senior Cloud Architect');
    expect(recommendations[0].overallScore).toBeGreaterThan(recommendations[1].overallScore);

    // Verify explainable rationale
    expect(recommendations[0].explanation.matchingSkills).toContain('aws');
    expect(recommendations[0].explanation.matchingSkills).toContain('docker');
    expect(recommendations[0].explanation.reasons.length).toBeGreaterThan(0);
  });
});

