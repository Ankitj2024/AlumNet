import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { mentorshipRequestService } from '../../src/services/mentorshipRequest.service.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Mentorship Request Management & Throttling Policies', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should enforce pending request limits and rolling period throttling', async () => {
    const passwordHash = await hashPassword('Secret123!');

    const studentUser = await UserModel.create({
      email: 'student.throttle@university.edu',
      passwordHash,
      firstName: 'Tom',
      lastName: 'Student',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    const student = await StudentProfileModel.create({ userId: studentUser._id });

    // Create 4 mentors
    const mentors: any[] = [];
    for (let i = 1; i <= 4; i++) {
      const mentorUser = await UserModel.create({
        email: `mentor.th.${i}@alumni.edu`,
        passwordHash,
        firstName: `Mentor${i}`,
        lastName: 'Alumnus',
        role: 'ALUMNI_MENTOR',
        status: 'ACTIVE',
      });
      const mentor = await AlumnusModel.create({
        userId: mentorUser._id,
        professionalDesignation: 'Engineer',
        organisation: 'Tech Co',
        industry: 'Software',
        verificationStatus: 'VERIFIED',
        isSearchable: true,
      });
      await MentorCapacityModel.create({
        mentorId: mentor._id,
        maxActiveMentees: 2,
        currentActiveMentees: 0,
        isAcceptingRequests: true,
        isPaused: false,
      });
      mentors.push({ user: mentorUser, alumnus: mentor });
    }

    // Submit 3 requests (allowed max)
    await mentorshipRequestService.createRequest(studentUser._id.toString(), {
      mentorId: mentors[0].alumnus._id.toString(),
      careerObjective: 'Career guidance',
      requestMessage: 'Request 1 message with sufficient length',
      preferredTopics: ['Topic 1'],
      expectedOutcomes: 'Outcomes 1',
      preferredAvailability: 'Weekends',
    });

    await mentorshipRequestService.createRequest(studentUser._id.toString(), {
      mentorId: mentors[1].alumnus._id.toString(),
      careerObjective: 'Career guidance',
      requestMessage: 'Request 2 message with sufficient length',
      preferredTopics: ['Topic 2'],
      expectedOutcomes: 'Outcomes 2',
      preferredAvailability: 'Weekends',
    });

    await mentorshipRequestService.createRequest(studentUser._id.toString(), {
      mentorId: mentors[2].alumnus._id.toString(),
      careerObjective: 'Career guidance',
      requestMessage: 'Request 3 message with sufficient length',
      preferredTopics: ['Topic 3'],
      expectedOutcomes: 'Outcomes 3',
      preferredAvailability: 'Weekends',
    });

    // 4th request must be rejected with 429 Throttle limit reached
    await expect(
      mentorshipRequestService.createRequest(studentUser._id.toString(), {
        mentorId: mentors[3].alumnus._id.toString(),
        careerObjective: 'Career guidance',
        requestMessage: 'Request 4 message with sufficient length',
        preferredTopics: ['Topic 4'],
        expectedOutcomes: 'Outcomes 4',
        preferredAvailability: 'Weekends',
      })
    ).rejects.toThrow(/Throttled: You already have 3 pending requests/);
  });
});

