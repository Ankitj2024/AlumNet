import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { UserModel } from '../../src/models/User.model.js';
import { AlumnusModel } from '../../src/models/Alumnus.model.js';
import { StudentProfileModel } from '../../src/models/StudentProfile.model.js';
import { MentorshipRequestModel } from '../../src/models/MentorshipRequest.model.js';
import { MentorshipModel } from '../../src/models/Mentorship.model.js';
import { messagingService } from '../../src/services/messaging.service.js';
import { hashPassword } from '../../src/utils/password.util.js';

describe('Secure In-Platform Messaging & PII Screening Shield', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  it('should detect and mask email addresses and phone numbers in messages', async () => {
    const passwordHash = await hashPassword('Secret123!');

    const studentUser = await UserModel.create({
      email: 'student.msg@university.edu',
      passwordHash,
      firstName: 'Sam',
      lastName: 'Student',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    const student = await StudentProfileModel.create({ userId: studentUser._id });

    const mentorUser = await UserModel.create({
      email: 'mentor.msg@alumni.edu',
      passwordHash,
      firstName: 'Mary',
      lastName: 'Mentor',
      role: 'ALUMNI_MENTOR',
      status: 'ACTIVE',
    });
    const mentor = await AlumnusModel.create({
      userId: mentorUser._id,
      verificationStatus: 'VERIFIED',
      isSearchable: true,
    });

    const request = await MentorshipRequestModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      careerObjective: 'Career guidance',
      requestMessage: 'Please mentor me',
      status: 'ACCEPTED',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const mentorship = await MentorshipModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      requestId: request._id,
      status: 'ACTIVE',
    });

    // 1. Message with plain email
    const msg1 = await messagingService.sendMessage(
      studentUser._id.toString(),
      mentorship._id.toString(),
      'Please email me directly at private.sam@gmail.com for the notes.'
    );

    expect(msg1.piiDetected).toBe(true);
    expect(msg1.piiTypesDetected).toContain('EMAIL');
    expect(msg1.content).toContain('[CONTACT DETAIL REDACTED]');
    expect(msg1.content).not.toContain('private.sam@gmail.com');

    // 2. Message with phone number
    const msg2 = await messagingService.sendMessage(
      studentUser._id.toString(),
      mentorship._id.toString(),
      'Call or message me on WhatsApp at +1-555-892-4912.'
    );

    expect(msg2.piiDetected).toBe(true);
    expect(msg2.piiTypesDetected).toContain('PHONE');
    expect(msg2.content).toContain('[PHONE NUMBER REDACTED]');
    expect(msg2.content).not.toContain('+1-555-892-4912');

    // 3. Clean professional message
    const msg3 = await messagingService.sendMessage(
      mentorUser._id.toString(),
      mentorship._id.toString(),
      'Looking forward to reviewing your distributed systems project tomorrow.'
    );

    expect(msg3.piiDetected).toBe(false);
    expect(msg3.content).toBe('Looking forward to reviewing your distributed systems project tomorrow.');
  });
});

