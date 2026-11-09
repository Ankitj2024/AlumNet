import { Types } from 'mongoose';
import {
  ProposeSessionInput,
  RescheduleSessionInput,
  SessionNotesInput,
  SessionFeedbackInput,
} from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { SessionModel, ISessionDocument } from '../models/Session.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { AvailabilityWindowModel } from '../models/AvailabilityWindow.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { AlumnusModel } from '../models/Alumnus.model.js';
import { UserModel } from '../models/User.model.js';
import { meetProvider } from '../integrations/meet/index.js';
import { generateIcsContent } from '../utils/ics.util.js';
import { notificationService } from './notification.service.js';
import { auditService } from './audit.service.js';

export class SchedulingService {
  /**
   * Validate that proposed time falls within mentor availability windows (if configured)
   */
  private async validateAvailabilityWindow(mentorId: Types.ObjectId, start: Date, end: Date) {
    const windows = await AvailabilityWindowModel.find({ mentorId });
    if (windows.length === 0) {
      // If no custom availability windows configured, mentor accepts standard proposals
      return;
    }

    const startUtcDay = start.getUTCDay();
    const startHours = start.getUTCHours().toString().padStart(2, '0');
    const startMins = start.getUTCMinutes().toString().padStart(2, '0');
    const startTimeStr = `${startHours}:${startMins}`;

    const matchingWindow = windows.find((w) => {
      if (w.dayOfWeek !== startUtcDay) return false;

      // Check blackout dates
      if (w.blackoutDates && w.blackoutDates.length > 0) {
        const isBlackedOut = w.blackoutDates.some(
          (b) => b.toISOString().slice(0, 10) === start.toISOString().slice(0, 10)
        );
        if (isBlackedOut) return false;
      }

      // Check time range
      return startTimeStr >= w.startTimeUTC && startTimeStr <= w.endTimeUTC;
    });

    if (!matchingWindow) {
      throw new AppError(
        'Proposed session slot falls outside mentor configured availability windows.',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  /**
   * Prevent double-booking across all confirmed sessions for both mentor and student
   */
  private async checkDoubleBooking(
    mentorshipId: string,
    start: Date,
    end: Date,
    excludeSessionId?: string
  ) {
    const currentMentorship = await MentorshipModel.findById(mentorshipId);
    if (!currentMentorship) {
      throw new AppError('Mentorship not found.', 404, ErrorCodes.NOT_FOUND);
    }

    // Find all mentorships involving this mentor
    const mentorMentorships = await MentorshipModel.find({
      mentorId: currentMentorship.mentorId,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    }).select('_id');
    const mentorMentorshipIds = mentorMentorships.map((m) => m._id);

    // Find all mentorships involving this student
    const studentMentorships = await MentorshipModel.find({
      studentId: currentMentorship.studentId,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    }).select('_id');
    const studentMentorshipIds = studentMentorships.map((m) => m._id);

    const relevantMentorshipIds = Array.from(
      new Set([...mentorMentorshipIds.map(String), ...studentMentorshipIds.map(String)])
    ).map((id) => new Types.ObjectId(id));

    const conflictQuery: any = {
      mentorshipId: { $in: relevantMentorshipIds },
      status: 'CONFIRMED',
      scheduledStartTime: { $lt: end },
      scheduledEndTime: { $gt: start },
    };

    if (excludeSessionId) {
      conflictQuery._id = { $ne: new Types.ObjectId(excludeSessionId) };
    }

    const conflict = await SessionModel.findOne(conflictQuery);
    if (conflict) {
      throw new AppError(
        'Double-booking conflict: Either mentor or student already has a confirmed session in this scheduled time window.',
        409,
        ErrorCodes.CONFLICT
      );
    }
  }

  /**
   * Propose a new session
   */
  async proposeSession(userId: string, mentorshipId: string, input: ProposeSessionInput) {
    const mentorship = await MentorshipModel.findById(mentorshipId)
      .populate('studentId')
      .populate('mentorId');

    if (!mentorship || mentorship.status !== 'ACTIVE') {
      throw new AppError('Active mentorship required to schedule sessions.', 400, ErrorCodes.BAD_REQUEST);
    }

    const start = new Date(input.scheduledStartTime);
    const end = new Date(input.scheduledEndTime);

    if (start >= end) {
      throw new AppError('Scheduled start time must precede end time.', 400, ErrorCodes.BAD_REQUEST);
    }

    if (start < new Date()) {
      throw new AppError('Cannot schedule sessions in the past.', 400, ErrorCodes.BAD_REQUEST);
    }

    // 1. Verify slot against mentor availability windows
    await this.validateAvailabilityWindow(mentorship.mentorId as any, start, end);

    // 2. Comprehensive Double-Booking Conflict Detection
    await this.checkDoubleBooking(mentorshipId, start, end);

    // 3. Create proposed session
    const session = await SessionModel.create({
      mentorshipId: new Types.ObjectId(mentorshipId),
      scheduledStartTime: start,
      scheduledEndTime: end,
      timeZone: input.timeZone || 'UTC',
      status: 'PROPOSED',
      proposedBy: new Types.ObjectId(userId),
      agenda: input.agenda,
      reminded24h: false,
      reminded1h: false,
    });

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    // 4. Dispatch notification to counterparty
    const studentUser = (mentorship.studentId as any)?.userId;
    const mentorUser = (mentorship.mentorId as any)?.userId;
    const counterpartyUserId =
      userId === studentUser?.toString() ? mentorUser?.toString() : studentUser?.toString();

    if (counterpartyUserId) {
      await notificationService.sendNotification({
        userId: counterpartyUserId,
        type: 'SESSION_PROPOSED',
        title: 'New Mentorship Session Proposed',
        message: `A session has been proposed for ${start.toLocaleDateString()} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please review and confirm.`,
        metadata: { sessionId: session._id.toString(), mentorshipId },
        idempotencyKey: `notif:session_prop:${session._id.toString()}`,
      });
    }

    return session;
  }

  /**
   * Confirm session: Invokes MeetProvider to generate Google Meet link
   */
  async confirmSession(userId: string, sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session || (session.status !== 'PROPOSED' && session.status !== 'RESCHEDULED')) {
      throw new AppError('Valid proposed or rescheduled session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const mentorship = await MentorshipModel.findById(session.mentorshipId)
      .populate('studentId')
      .populate('mentorId');

    if (!mentorship) {
      throw new AppError('Mentorship not found.', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify double-booking before finalizing confirmation
    await this.checkDoubleBooking(
      session.mentorshipId.toString(),
      session.scheduledStartTime,
      session.scheduledEndTime,
      session._id.toString()
    );

    // Generate Google Meet conference link via MeetProvider
    const studentUser = (mentorship.studentId as any)?.userId;
    const mentorUser = (mentorship.mentorId as any)?.userId;

    const [studentDoc, mentorDoc] = await Promise.all([
      UserModel.findById(studentUser),
      UserModel.findById(mentorUser),
    ]);

    const meetResult = await meetProvider.createMeeting({
      topic: session.agenda || 'Mentorship Check-In',
      startTime: session.scheduledStartTime,
      endTime: session.scheduledEndTime,
      timeZone: session.timeZone,
      organizerEmail: mentorDoc?.email,
      attendeeEmail: studentDoc?.email,
    });

    session.status = 'CONFIRMED';
    session.meetingLink = meetResult.meetingLink;
    await session.save();

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    // Dispatch notifications to both participants
    const confirmationMsg = `Session confirmed for ${session.scheduledStartTime.toLocaleString()}. Google Meet link: ${meetResult.meetingLink}`;

    if (studentUser) {
      await notificationService.sendNotification({
        userId: studentUser.toString(),
        type: 'SESSION_CONFIRMED',
        title: 'Mentorship Session Confirmed!',
        message: confirmationMsg,
        metadata: { sessionId: session._id.toString(), meetingLink: meetResult.meetingLink },
        idempotencyKey: `notif:session_conf:student:${session._id.toString()}`,
      });
    }

    if (mentorUser) {
      await notificationService.sendNotification({
        userId: mentorUser.toString(),
        type: 'SESSION_CONFIRMED',
        title: 'Mentorship Session Confirmed!',
        message: confirmationMsg,
        metadata: { sessionId: session._id.toString(), meetingLink: meetResult.meetingLink },
        idempotencyKey: `notif:session_conf:mentor:${session._id.toString()}`,
      });
    }

    return session;
  }

  /**
   * Reschedule session
   */
  async rescheduleSession(userId: string, sessionId: string, input: RescheduleSessionInput) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const start = new Date(input.scheduledStartTime);
    const end = new Date(input.scheduledEndTime);

    if (start >= end) {
      throw new AppError('Start time must precede end time.', 400, ErrorCodes.BAD_REQUEST);
    }
    if (start < new Date()) {
      throw new AppError('Cannot reschedule session to the past.', 400, ErrorCodes.BAD_REQUEST);
    }

    const mentorship = await MentorshipModel.findById(session.mentorshipId);
    if (!mentorship) {
      throw new AppError('Mentorship not found.', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify slot against availability & double booking
    await this.validateAvailabilityWindow(mentorship.mentorId, start, end);
    await this.checkDoubleBooking(session.mentorshipId.toString(), start, end, session._id.toString());

    session.scheduledStartTime = start;
    session.scheduledEndTime = end;
    session.timeZone = input.timeZone || session.timeZone;
    session.status = 'RESCHEDULED';
    session.cancellationReason = input.reason ? `Rescheduled: ${input.reason}` : undefined;
    session.reminded24h = false;
    session.reminded1h = false;

    // Regenerate Google Meet conference link
    const meetResult = await meetProvider.createMeeting({
      topic: session.agenda || 'Mentorship Rescheduled Session',
      startTime: start,
      endTime: end,
      timeZone: session.timeZone,
    });
    session.meetingLink = meetResult.meetingLink;

    await session.save();

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    return session;
  }

  /**
   * Cancel session with mandatory reason
   */
  async cancelSession(userId: string, sessionId: string, reason: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    session.status = 'CANCELLED';
    session.cancellationReason = reason || 'Session cancelled by participant';
    await session.save();

    const mentorship = await MentorshipModel.findById(session.mentorshipId)
      .populate('studentId')
      .populate('mentorId');

    if (mentorship) {
      const studentUser = (mentorship.studentId as any)?.userId;
      const mentorUser = (mentorship.mentorId as any)?.userId;

      const cancelMsg = `The mentorship session scheduled for ${session.scheduledStartTime.toLocaleString()} was cancelled. Reason: "${reason}"`;

      if (studentUser) {
        await notificationService.sendNotification({
          userId: studentUser.toString(),
          type: 'SESSION_CANCELLED',
          title: 'Mentorship Session Cancelled',
          message: cancelMsg,
          metadata: { sessionId: session._id.toString() },
          idempotencyKey: `notif:session_canc:student:${session._id.toString()}`,
        });
      }

      if (mentorUser) {
        await notificationService.sendNotification({
          userId: mentorUser.toString(),
          type: 'SESSION_CANCELLED',
          title: 'Mentorship Session Cancelled',
          message: cancelMsg,
          metadata: { sessionId: session._id.toString() },
          idempotencyKey: `notif:session_canc:mentor:${session._id.toString()}`,
        });
      }
    }

    return session;
  }

  /**
   * Mark session as NO_SHOW
   */
  async recordNoShow(userId: string, sessionId: string, notes?: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    session.status = 'NO_SHOW';
    session.cancellationReason = notes || 'Participant failed to attend scheduled session (No-Show).';
    await session.save();

    return session;
  }

  /**
   * Record post-session notes (mentorNotes & sharedNotes) & mark completed
   */
  async recordSessionNotes(userId: string, sessionId: string, input: SessionNotesInput) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    if (input.mentorNotes !== undefined) session.mentorNotes = input.mentorNotes;
    if (input.sharedNotes !== undefined) session.sharedNotes = input.sharedNotes;
    session.status = 'COMPLETED';
    await session.save();

    // Increment completed sessions count on mentorship
    await MentorshipModel.findByIdAndUpdate(session.mentorshipId, {
      $inc: { totalSessionsCompleted: 1 },
      lastMeaningfulActivityAt: new Date(),
    });

    return session;
  }

  /**
   * Submit student feedback and rating (1 to 5)
   */
  async submitStudentRating(userId: string, sessionId: string, input: SessionFeedbackInput) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    session.studentRating = input.rating;
    if (input.feedback) session.studentFeedback = input.feedback;
    await session.save();

    return session;
  }

  /**
   * Generate RFC 5545 .ics Calendar File
   */
  async generateIcsFile(sessionId: string): Promise<string> {
    const session = await SessionModel.findById(sessionId).populate({
      path: 'mentorshipId',
      populate: [{ path: 'mentorId', populate: { path: 'userId' } }],
    });

    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const mentorUser = (session.mentorshipId as any)?.mentorId?.userId;

    return generateIcsContent({
      sessionId: session._id.toString(),
      topic: session.agenda || 'Alumni Mentorship Session',
      startTime: session.scheduledStartTime,
      endTime: session.scheduledEndTime,
      timeZone: session.timeZone,
      meetingLink: session.meetingLink,
      organizerName: mentorUser ? `${mentorUser.firstName} ${mentorUser.lastName}` : 'Alumni Mentor',
      organizerEmail: mentorUser?.email,
    });
  }

  async getMentorshipSessions(mentorshipId: string) {
    return SessionModel.find({ mentorshipId }).sort({ scheduledStartTime: 1 });
  }
}

export const schedulingService = new SchedulingService();
