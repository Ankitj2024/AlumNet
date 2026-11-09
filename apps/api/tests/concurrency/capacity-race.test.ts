import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model.js';
import { MentorshipModel } from '../../src/models/Mentorship.model.js';
import { mentorshipRequestService } from '../../src/services/mentorshipRequest.service.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('CONCURRENCY INVARIANT TESTS — Mentor Capacity & Rolling Quota Race Protection', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('MUST NEVER exceed maxActiveMentees under 20 concurrent simultaneous acceptance attempts', async () => {
    const passwordHash = await hashPassword('Secret123!');

    // 1. Create a mentor with maximum capacity = 2
    const mentorUser = await UserModel.create({
      email: 'concurrent20.mentor@alumni.edu',
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
      maxActiveMentees: 2, // STRICT CEILING: EXACTLY 2
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // 2. Create 20 different students submitting requests to this mentor
    const requestIds: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const studentUser = await UserModel.create({
        email: `student.concurrent.${i}@university.edu`,
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

    // 3. Fire all 20 acceptance requests concurrently in parallel
    const results = await Promise.allSettled(
      requestIds.map((reqId) =>
        mentorshipRequestService.acceptRequest(mentorUser._id.toString(), reqId)
      )
    );

    // 4. Inspect acceptance outcomes
    const successful = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 2 must succeed, 18 must be rejected
    expect(successful.length).toBe(2);
    expect(rejected.length).toBe(18);

    // 5. Invariant check on database: capacity must be exactly 2, never exceeding maxActiveMentees
    const finalCapacity = await MentorCapacityModel.findOne({ mentorId: mentor._id });
    expect(finalCapacity?.currentActiveMentees).toBe(2);
    expect(finalCapacity!.currentActiveMentees).toBeLessThanOrEqual(finalCapacity!.maxActiveMentees);

    // 6. Test capacity release exactly once when a mentorship concludes
    const acceptedRequests = await MentorshipRequestModel.find({ mentorId: mentor._id, status: 'ACCEPTED' });
    expect(acceptedRequests.length).toBe(2);

    const activeMentorship = await MentorshipModel.findOne({
      requestId: acceptedRequests[0]._id,
    });

    await mentorshipRequestService.closeMentorship(mentorUser._id.toString(), activeMentorship!._id.toString());

    // Capacity must have decremented to 1
    const capacityAfterClose = await MentorCapacityModel.findOne({ mentorId: mentor._id });
    expect(capacityAfterClose?.currentActiveMentees).toBe(1);
  });

  it('MUST enforce quota limits and rolling window under rapid parallel request creation attempts', async () => {
    const passwordHash = await hashPassword('Secret123!');

    // 1. Create a student with max pending requests = 3
    const studentUser = await UserModel.create({
      email: 'student.quota.race@univ.edu',
      passwordHash,
      firstName: 'Speedy',
      lastName: 'Student',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    await StudentProfileModel.create({
      userId: studentUser._id,
      academicProgramme: 'B.Tech',
      department: 'Computer Science',
    });

    // 2. Create 10 different verified alumni mentors
    const mentorIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const mentorUser = await UserModel.create({
        email: `mentor.quota.${i}@alumni.edu`,
        passwordHash,
        firstName: `Mentor${i}`,
        lastName: 'Alum',
        role: 'ALUMNI_MENTOR',
        status: 'ACTIVE',
      });

      const mentor = await AlumnusModel.create({
        userId: mentorUser._id,
        professionalDesignation: 'Staff Engineer',
        organisation: 'Tech Corp',
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

      mentorIds.push(mentor._id.toString());
    }

    // 3. Student fires 10 simultaneous request creation calls in parallel
    const requestPromises = mentorIds.map((mId) =>
      mentorshipRequestService.createRequest(studentUser._id.toString(), {
        mentorId: mId,
        careerObjective: 'Career guidance and interview preparation',
        requestMessage: 'Would love your guidance on system design and algorithms.',
      })
    );

    const results = await Promise.allSettled(requestPromises);

    const successful = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 3 can be pending at any time (as per PROGRAMME_DEFAULTS.MAX_PENDING_REQUESTS_PER_STUDENT)
    expect(successful.length).toBe(3);
    expect(rejected.length).toBe(7);

    // Verify in database: exactly 3 pending requests exist for this student
    const studentProfile = await StudentProfileModel.findOne({ userId: studentUser._id });
    const pendingCount = await MentorshipRequestModel.countDocuments({
      studentId: studentProfile?._id,
      status: 'PENDING',
    });
    expect(pendingCount).toBe(3);
  });
});
