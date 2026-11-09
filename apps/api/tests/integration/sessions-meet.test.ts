import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorCapacityModel } from '../../src/models/MentorCapacity.model.js';
import { AvailabilityWindowModel } from '../../src/models/AvailabilityWindow.model.js';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model.js';
import { MentorshipModel } from '../../src/models/Mentorship.model.js';
import { SessionModel } from '../../src/models/Session.model.js';
import { MockMeetProvider, GoogleCalendarMeetProvider } from '../../src/integrations/meet/index.js';

describe('Task 5: Sessions, Google Meet Integration & Availability Tests', () => {
  const app = createApp();
  let studentToken: string;
  let mentorToken: string;
  let mentorUserId: string;
  let studentUserId: string;
  let mentorAlumnusId: string;
  let studentProfileId: string;
  let mentorshipId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // 1. Create Mentor
    const mentorRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'mentor.sessions@alumni.edu',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Mentor',
        role: 'ALUMNI_MENTOR',
      });
    mentorToken = mentorRes.body.data.token;
    mentorUserId = mentorRes.body.data.user.id;

    const alumnus = await AlumnusModel.findOne({ userId: mentorUserId });
    alumnus!.verificationStatus = 'VERIFIED';
    alumnus!.isSearchable = true;
    await alumnus!.save();
    mentorAlumnusId = alumnus!._id.toString();

    // 2. Create Student
    const studentRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'student.sessions@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Bob',
        lastName: 'Student',
        role: 'STUDENT',
      });
    studentToken = studentRes.body.data.token;
    studentUserId = studentRes.body.data.user.id;

    const studentProfile = await StudentProfileModel.findOne({ userId: studentUserId });
    studentProfileId = studentProfile!._id.toString();

    // 3. Create active mentorship
    const mReq = await MentorshipRequestModel.create({
      studentId: studentProfileId,
      mentorId: mentorAlumnusId,
      careerObjective: 'Career guidance',
      requestMessage: 'Looking for mentorship',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });

    const mentorship = await MentorshipModel.create({
      studentId: studentProfileId,
      mentorId: mentorAlumnusId,
      requestId: mReq._id,
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      startDate: new Date(),
      lastMeaningfulActivityAt: new Date(),
    });
    mentorshipId = mentorship._id.toString();
  });

  describe('1. MeetProvider Adapters', () => {
    it('MockMeetProvider should generate valid deterministic Google Meet links', async () => {
      const provider = new MockMeetProvider();
      const result = await provider.createMeeting({
        topic: 'Resume Review',
        startTime: new Date('2026-10-15T14:00:00Z'),
        endTime: new Date('2026-10-15T15:00:00Z'),
        timeZone: 'UTC',
      });

      expect(result.provider).toBe('mock');
      expect(result.meetingLink).toMatch(/^https:\/\/meet\.google\.com\/[a-z0-9-]+$/);
    });

    it('GoogleCalendarMeetProvider should generate calendar meeting structures with conferenceData', async () => {
      const provider = new GoogleCalendarMeetProvider();
      const result = await provider.createMeeting({
        topic: 'Engineering System Design',
        startTime: new Date('2026-10-16T16:00:00Z'),
        endTime: new Date('2026-10-16T17:00:00Z'),
        timeZone: 'America/New_York',
        organizerEmail: 'mentor@alumni.edu',
        attendeeEmail: 'student@university.edu',
      });

      expect(result.meetingLink).toMatch(/^https:\/\/meet\.google\.com\//);
    });
  });

  describe('2. Availability Window & Double-Booking Prevention', () => {
    it('should validate proposed session against mentor availability windows (Wednesday 14:00-18:00 UTC)', async () => {
      // Configure mentor availability window for Wednesday (dayOfWeek = 3) between 14:00 and 18:00 UTC
      await AvailabilityWindowModel.create({
        mentorId: mentorAlumnusId,
        dayOfWeek: 3, // Wednesday
        startTimeUTC: '14:00',
        endTimeUTC: '18:00',
        mentorTimeZone: 'UTC',
      });

      // Attempt slot on Monday (dayOfWeek = 1) -> Must reject with 400
      // 2026-11-16 is a future Monday
      const invalidDayRes = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          scheduledStartTime: '2026-11-16T15:00:00Z',
          scheduledEndTime: '2026-11-16T16:00:00Z',
          timeZone: 'UTC',
          agenda: 'Monday session attempt',
        });

      expect(invalidDayRes.status).toBe(400);
      expect(invalidDayRes.body.error.message).toContain('falls outside mentor configured availability windows');

      // Attempt slot on Wednesday 2026-11-18 at 15:00 UTC -> Must succeed
      const validDayRes = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          scheduledStartTime: '2026-11-18T15:00:00Z',
          scheduledEndTime: '2026-11-18T16:00:00Z',
          timeZone: 'UTC',
          agenda: 'Valid Wednesday session',
        });

      expect(validDayRes.status).toBe(201);
      expect(validDayRes.body.success).toBe(true);
      expect(validDayRes.body.data.status).toBe('PROPOSED');
    });

    it('should prevent double-booking when a confirmed session already overlaps the window', async () => {
      // 1. Create a confirmed session from 14:00 to 15:00 on future date Nov 25
      await SessionModel.create({
        mentorshipId,
        scheduledStartTime: new Date('2026-11-25T14:00:00Z'),
        scheduledEndTime: new Date('2026-11-25T15:00:00Z'),
        timeZone: 'UTC',
        status: 'CONFIRMED',
        proposedBy: mentorUserId,
        meetingLink: 'https://meet.google.com/conf-test',
      });

      // 2. Attempt to propose an overlapping session (14:30 to 15:30) on Nov 25
      const conflictRes = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          scheduledStartTime: '2026-11-25T14:30:00Z',
          scheduledEndTime: '2026-11-25T15:30:00Z',
          timeZone: 'UTC',
          agenda: 'Overlapping session attempt',
        });

      expect(conflictRes.status).toBe(409);
      expect(conflictRes.body.error.message).toContain('Double-booking conflict');
    });
  });

  describe('3. Session Confirmation & Google Meet Creation', () => {
    it('should confirm proposed session and generate meeting link via MeetProvider', async () => {
      const proposeRes = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          scheduledStartTime: '2026-12-01T10:00:00Z',
          scheduledEndTime: '2026-12-01T11:00:00Z',
          timeZone: 'UTC',
          agenda: 'Quarterly review',
        });

      const sessionId = proposeRes.body.data._id;

      // Mentor confirms session
      const confirmRes = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${sessionId}/confirm`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');
      expect(confirmRes.body.data.meetingLink).toMatch(/^https:\/\/meet\.google\.com\//);
    });
  });

  describe('4. Reschedule, Cancel with Reason, NO_SHOW, Notes, Rating & .ics Download', () => {
    let testSessionId: string;

    beforeEach(async () => {
      const sess = await SessionModel.create({
        mentorshipId,
        scheduledStartTime: new Date('2026-12-10T14:00:00Z'),
        scheduledEndTime: new Date('2026-12-10T15:00:00Z'),
        timeZone: 'UTC',
        status: 'CONFIRMED',
        proposedBy: mentorUserId,
        meetingLink: 'https://meet.google.com/test-session-link',
      });
      testSessionId = sess._id.toString();
    });

    it('should support rescheduling a session to a new time window', async () => {
      const res = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/reschedule`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          scheduledStartTime: '2026-12-11T14:00:00Z',
          scheduledEndTime: '2026-12-11T15:00:00Z',
          timeZone: 'UTC',
          reason: 'Conflict with team meeting',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESCHEDULED');
      expect(res.body.data.meetingLink).toBeDefined();
    });

    it('should cancel session with mandatory cancellation reason', async () => {
      const res = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Family emergency, need to reschedule later',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.cancellationReason).toContain('Family emergency');
    });

    it('should record NO_SHOW when participant does not attend', async () => {
      const res = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/no-show`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          notes: 'Mentee did not connect within 15 minutes of scheduled start',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('NO_SHOW');
    });

    it('should record post-session mentorNotes, sharedNotes, and mark completed', async () => {
      const res = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/notes`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          mentorNotes: 'Student needs more practice on tree traversal algorithms.',
          sharedNotes: 'Agreed next milestone: Complete LeetCode 3 binary tree questions by Friday.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.mentorNotes).toBeDefined();
      expect(res.body.data.sharedNotes).toBeDefined();

      // Check mentorship sessions completed incremented
      const mDoc = await MentorshipModel.findById(mentorshipId);
      expect(mDoc?.totalSessionsCompleted).toBe(1);
    });

    it('should submit student rating (1-5) and feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/rating`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 5,
          feedback: 'Exceptional advice on preparing for mock system design interviews.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.studentRating).toBe(5);
      expect(res.body.data.studentFeedback).toContain('Exceptional advice');
    });

    it('should download valid RFC 5545 .ics calendar file', async () => {
      const res = await request(app)
        .get(`/api/v1/mentorships/${mentorshipId}/sessions/${testSessionId}/ics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/calendar');
      expect(res.text).toContain('BEGIN:VCALENDAR');
      expect(res.text).toContain('BEGIN:VEVENT');
      expect(res.text).toContain(`UID:p11-session-${testSessionId}@alumni.edu`);
      expect(res.text).toContain('STATUS:CONFIRMED');
      expect(res.text).toContain('END:VCALENDAR');
    });
  });
});
