import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model.js';
import { MentorshipModel } from '../../src/models/Mentorship.model.js';
import { SessionModel } from '../../src/models/Session.model.js';
import { NotificationModel } from '../../src/models/Notification.model.js';
import {
  ManualClock,
  expireRequestsJob,
  autoCancelOnFullJob,
  recomputeHealthJob,
  reconcileCapacityJob,
  resumePausedMentorsJob,
  sessionRemindersJob,
} from '../../src/jobs/backgroundJobs.js';

describe('Task 3: Background Jobs Engine & Injectable Clock Unit Tests', () => {
  let mentorUser: any;
  let mentorAlumnus: any;
  let studentUser: any;
  let studentProfile: any;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Seed mentor
    mentorUser = await UserModel.create({
      email: 'mentor.jobs@alumni.edu',
      passwordHash: 'dummyhash',
      firstName: 'Jane',
      lastName: 'Mentor',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
      isEmailVerified: true,
      failedLoginAttempts: 0,
    });

    mentorAlumnus = await AlumnusModel.create({
      userId: mentorUser._id,
      verificationStatus: 'VERIFIED',
      isSearchable: true,
      professionalDesignation: 'Staff Engineer',
      organisation: 'TechCorp',
      industry: 'Technology',
      expertiseTags: ['TypeScript', 'Cloud'],
    });

    await MentorCapacityModel.create({
      mentorId: mentorAlumnus._id,
      maxActiveMentees: 2,
      currentActiveMentees: 0,
      isAcceptingRequests: true,
      isPaused: false,
    });

    // Seed student
    studentUser = await UserModel.create({
      email: 'student.jobs@university.edu',
      passwordHash: 'dummyhash',
      firstName: 'Alex',
      lastName: 'Student',
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
      failedLoginAttempts: 0,
    });

    studentProfile = await StudentProfileModel.create({
      userId: studentUser._id,
      skills: ['TypeScript'],
      targetJobRoles: ['Staff Engineer'],
      preferredIndustries: ['Technology'],
      profileCompletionScore: 90,
    });
  });

  describe('Job 1: expireRequests', () => {
    it('should expire pending requests whose expiry date has passed and notify parties', async () => {
      const clock = new ManualClock(new Date('2026-09-01T12:00:00Z'));

      // Create request expiring on Sep 8
      const req = await MentorshipRequestModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        careerObjective: 'Career guidance',
        requestMessage: 'Hello mentor',
        status: 'PENDING',
        expiresAt: new Date('2026-09-08T12:00:00Z'),
      });

      // Advance clock to Sep 7 (before expiry)
      clock.advanceDays(6);
      let res = await expireRequestsJob(clock);
      expect(res.expiredCount).toBe(0);

      // Advance clock past expiry (Sep 9)
      clock.advanceDays(2);
      res = await expireRequestsJob(clock);
      expect(res.expiredCount).toBe(1);

      const updated = await MentorshipRequestModel.findById(req._id);
      expect(updated?.status).toBe('EXPIRED');

      // Check notifications generated
      const notifs = await NotificationModel.find({ type: 'REQUEST_EXPIRED' });
      expect(notifs.length).toBe(2); // One for student, one for mentor
    });
  });

  describe('Job 2: autoCancelOnFull', () => {
    it('should cancel remaining pending requests when a mentor becomes full and suggest alternatives', async () => {
      const clock = new ManualClock();

      // Create 2 pending requests
      const req1 = await MentorshipRequestModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        careerObjective: 'Career guidance 1',
        requestMessage: 'Hello mentor 1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      });

      const res = await autoCancelOnFullJob(mentorAlumnus._id.toString(), clock);
      expect(res.cancelledCount).toBe(1);

      const updated = await MentorshipRequestModel.findById(req1._id);
      expect(updated?.status).toBe('AUTO_CANCELLED');

      const notif = await NotificationModel.findOne({
        userId: studentUser._id,
        type: 'REQUEST_AUTO_CANCELLED',
      });
      expect(notif).toBeDefined();
      expect(notif?.title).toContain('Mentor Capacity Reached');
    });
  });

  describe('Job 3: recomputeHealth — Exact Day Boundaries (Days 14, 15, 28, 29, 36)', () => {
    it('should evaluate exact health boundaries: HEALTHY at day 14, AT_RISK at day 15, DORMANT at day 29, and CLOSED after 7-day grace', async () => {
      const baseDate = new Date('2026-01-01T00:00:00Z');
      const clock = new ManualClock(baseDate);

      // Create a request & active mentorship
      const req = await MentorshipRequestModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        careerObjective: 'Career path',
        requestMessage: 'Please mentor me',
        status: 'ACCEPTED',
        expiresAt: new Date(baseDate.getTime() + 7 * 24 * 3600 * 1000),
      });

      const mentorship = await MentorshipModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        requestId: req._id,
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        startDate: baseDate,
        lastMeaningfulActivityAt: baseDate,
      });

      // Update mentor capacity to reflect 1 active mentee
      await MentorCapacityModel.updateOne(
        { mentorId: mentorAlumnus._id },
        { currentActiveMentees: 1 }
      );

      // --- BOUNDARY 1: Exact Day 14 (HEALTHY) ---
      clock.advanceDays(14);
      let healthRes = await recomputeHealthJob(clock);
      expect(healthRes.healthyCount).toBe(1);
      expect(healthRes.atRiskCount).toBe(0);

      let currentMentorship = await MentorshipModel.findById(mentorship._id);
      expect(currentMentorship?.healthStatus).toBe('HEALTHY');

      // --- BOUNDARY 2: Exact Day 15 (AT_RISK & Nudge) ---
      clock.advanceDays(1); // Now at Day 15
      healthRes = await recomputeHealthJob(clock);
      expect(healthRes.healthyCount).toBe(0);
      expect(healthRes.atRiskCount).toBe(1);

      currentMentorship = await MentorshipModel.findById(mentorship._id);
      expect(currentMentorship?.healthStatus).toBe('AT_RISK');
      expect(currentMentorship?.lastNudgeAt).toBeDefined();

      // Check nudge notifications generated for both parties
      let nudges = await NotificationModel.find({ type: 'HEALTH_NUDGE' });
      expect(nudges.length).toBe(2);

      // --- BOUNDARY 3: Exact Day 28 (Still AT_RISK) ---
      clock.advanceDays(13); // Now at Day 28 (15 + 13 = 28)
      healthRes = await recomputeHealthJob(clock);
      expect(healthRes.atRiskCount).toBe(1);

      currentMentorship = await MentorshipModel.findById(mentorship._id);
      expect(currentMentorship?.healthStatus).toBe('AT_RISK');

      // --- BOUNDARY 4: Exact Day 29 (Transitions to DORMANT) ---
      clock.advanceDays(1); // Now at Day 29
      healthRes = await recomputeHealthJob(clock);
      expect(healthRes.dormantCount).toBe(1);
      expect(healthRes.closedCount).toBe(0); // Grace period active!

      currentMentorship = await MentorshipModel.findById(mentorship._id);
      expect(currentMentorship?.healthStatus).toBe('DORMANT');
      expect(currentMentorship?.status).toBe('ACTIVE'); // Still ACTIVE during 7-day grace
      expect(currentMentorship?.dormantEnteredAt).toBeDefined();

      // --- BOUNDARY 5: 7-Day Grace Period Elapsed (Day 36 -> Auto-Closed & Capacity Decremented) ---
      clock.advanceDays(7); // Now at Day 36 (29 + 7)
      healthRes = await recomputeHealthJob(clock);
      expect(healthRes.closedCount).toBe(1);

      currentMentorship = await MentorshipModel.findById(mentorship._id);
      expect(currentMentorship?.status).toBe('TERMINATED');
      expect(currentMentorship?.closureReason).toContain('inactive for over 28 days');

      // Mentor capacity MUST be atomically decremented back to 0!
      const updatedCapacity = await MentorCapacityModel.findOne({ mentorId: mentorAlumnus._id });
      expect(updatedCapacity?.currentActiveMentees).toBe(0);
      expect(updatedCapacity?.isAcceptingRequests).toBe(true);
    });
  });

  describe('Job 4: reconcileCapacity', () => {
    it('should detect and fix drift between actual active mentorships and recorded capacity', async () => {
      const clock = new ManualClock();

      // Intentionally set stored capacity to 3 when there are 0 active mentorships
      await MentorCapacityModel.updateOne(
        { mentorId: mentorAlumnus._id },
        { currentActiveMentees: 3, isAcceptingRequests: false }
      );

      const res = await reconcileCapacityJob(clock);
      expect(res.reconciledMentors).toBe(1);
      expect(res.driftsCorrected).toBe(1);

      const fixedCapacity = await MentorCapacityModel.findOne({ mentorId: mentorAlumnus._id });
      expect(fixedCapacity?.currentActiveMentees).toBe(0);
      expect(fixedCapacity?.isAcceptingRequests).toBe(true);
    });
  });

  describe('Job 5: resumePausedMentors', () => {
    it('should auto-resume paused mentors when pausedUntil date is reached', async () => {
      const clock = new ManualClock(new Date('2026-05-01T00:00:00Z'));

      // Pause mentor until May 10
      await MentorCapacityModel.updateOne(
        { mentorId: mentorAlumnus._id },
        {
          isPaused: true,
          pausedUntil: new Date('2026-05-10T00:00:00Z'),
          pauseReason: 'On leave',
          isAcceptingRequests: false,
        }
      );

      // Advance clock to May 5 (still paused)
      clock.advanceDays(4);
      let res = await resumePausedMentorsJob(clock);
      expect(res.resumedCount).toBe(0);

      // Advance clock to May 11 (past pausedUntil)
      clock.advanceDays(6);
      res = await resumePausedMentorsJob(clock);
      expect(res.resumedCount).toBe(1);

      const resumedCap = await MentorCapacityModel.findOne({ mentorId: mentorAlumnus._id });
      expect(resumedCap?.isPaused).toBe(false);
      expect(resumedCap?.isAcceptingRequests).toBe(true);
      expect(resumedCap?.pausedUntil).toBeUndefined();
    });
  });

  describe('Job 6: sessionReminders', () => {
    it('should send 24h and 1h reminders for upcoming confirmed sessions', async () => {
      const clock = new ManualClock(new Date('2026-07-01T10:00:00Z'));

      // Mentorship
      const req = await MentorshipRequestModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        careerObjective: 'Goals',
        requestMessage: 'Help',
        status: 'ACCEPTED',
        expiresAt: new Date(),
      });
      const mentorship = await MentorshipModel.create({
        studentId: studentProfile._id,
        mentorId: mentorAlumnus._id,
        requestId: req._id,
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        startDate: new Date(),
        lastMeaningfulActivityAt: new Date(),
      });

      // Session starting in exactly 24 hours
      const session24 = await SessionModel.create({
        mentorshipId: mentorship._id,
        scheduledStartTime: new Date('2026-07-02T10:00:00Z'),
        scheduledEndTime: new Date('2026-07-02T11:00:00Z'),
        timeZone: 'UTC',
        status: 'CONFIRMED',
        proposedBy: mentorUser._id,
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        reminded24h: false,
        reminded1h: false,
      });

      // Check 24h reminders
      let res = await sessionRemindersJob(clock);
      expect(res.reminders24hSent).toBe(1);
      expect(res.reminders1hSent).toBe(0);

      const updatedSess24 = await SessionModel.findById(session24._id);
      expect(updatedSess24?.reminded24h).toBe(true);

      // Advance clock to 23 hours later (1 hour before session)
      clock.advanceHours(23); // Now 2026-07-02T09:00:00Z, session is at 10:00:00Z (1h away)
      res = await sessionRemindersJob(clock);
      expect(res.reminders1hSent).toBe(1);

      const updatedSess1 = await SessionModel.findById(session24._id);
      expect(updatedSess1?.reminded1h).toBe(true);

      const reminderNotifs = await NotificationModel.find({ type: 'SESSION_REMINDER' });
      expect(reminderNotifs.length).toBeGreaterThanOrEqual(2);
    });
  });
});
