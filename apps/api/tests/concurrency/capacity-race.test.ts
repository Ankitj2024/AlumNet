import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model.js';
import { mentorshipRequestService } from '../../src/services/mentorshipRequest.service.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('CONCURRENCY INVARIANT TEST — Mentor Capacity Invariant Protection', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('MUST NEVER exceed maxActiveMentees under concurrent simultaneous acceptance attempts', async () => {
    const passwordHash = await hashPassword('Secret123!');

    // 1. Create a mentor with maximum capacity = 2
    const mentorUser = await UserModel.create({
      email: 'concurrent.mentor@alumni.edu',
      passwordHash,
      firstName: 'Alan',
      lastName: 'Turing',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });

    const mentor = await AlumnusModel.create({
      userId: mentorUser._id,
      professionalDesignation: 'Principal Scientist',
      organisation: 'Bletchley Tech',
      industry: 'Computing',
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });

    await MentorCapacityModel.create({
      mentorId: mentor._id,
      maxActiveMentees: 2, // MAXIMUM ALLOWED IS 2
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // 2. Create 5 different students submitting requests to this mentor
    const requestIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const studentUser = await UserModel.create({
        email: `student.${i}@university.edu`,
        passwordHash,
        firstName: `Student${i}`,
        lastName: 'Test',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const student = await StudentProfileModel.create({
        userId: studentUser._id,
        academicProgramme: 'B.Tech',
        department: 'Computer Science',
      });

      const request = await MentorshipRequestModel.create({
        studentId: student._id,
        mentorId: mentor._id,
        careerObjective: `Objective ${i}`,
        requestMessage: `Hello, please mentor me ${i}`,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      requestIds.push(request._id.toString());
    }

    // 3. Fire all 5 acceptance requests concurrently at the exact same moment
    const results = await Promise.allSettled(
      requestIds.map((reqId) =>
        mentorshipRequestService.acceptRequest(mentorUser._id.toString(), reqId)
      )
    );

    // 4. Inspect acceptance outcomes
    const successful = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 2 must succeed, 3 must be rejected
    expect(successful.length).toBe(2);
    expect(rejected.length).toBe(3);

    // 5. Invariant check on the database record: capacity must be exactly 2, never 3, 4, or 5
    const finalCapacity = await MentorCapacityModel.findOne({ mentorId: mentor._id });
    expect(finalCapacity?.currentActiveMentees).toBe(2);
    expect(finalCapacity!.currentActiveMentees).toBeLessThanOrEqual(finalCapacity!.maxActiveMentees);

    // 6. Test capacity release exactly once when a mentorship concludes
    const acceptedRequests = await MentorshipRequestModel.find({ mentorId: mentor._id, status: 'ACCEPTED' });
    expect(acceptedRequests.length).toBe(2);

    // Conclude one mentorship
    const mentorships = await mentorshipRequestService.getStudentRequests(acceptedRequests[0].studentId.toString());
    // Directly close
    const activeMentorship = await (await import('../../src/models/Mentorship.model.js')).MentorshipModel.findOne({
      requestId: acceptedRequests[0]._id,
    });

    await mentorshipRequestService.closeMentorship(mentorUser._id.toString(), activeMentorship!._id.toString());

    // Capacity must have decremented to 1
    const capacityAfterClose = await MentorCapacityModel.findOne({ mentorId: mentor._id });
    expect(capacityAfterClose?.currentActiveMentees).toBe(1);
  });
});

