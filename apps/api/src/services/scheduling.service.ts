import { ProposeSessionInput } from '@p11/validation';
import { AppError, ErrorCodes } from '@p11/shared';
import { SessionModel } from '../models/Session.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { auditService } from './audit.service.js';

export class SchedulingService {
  async proposeSession(userId: string, mentorshipId: string, input: ProposeSessionInput) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
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

    // Conflict detection: Check for existing overlapping CONFIRMED sessions for this mentorship
    const conflict = await SessionModel.findOne({
      mentorshipId,
      status: 'CONFIRMED',
      $or: [
        { scheduledStartTime: { $lt: end }, scheduledEndTime: { $gt: start } },
      ],
    });

    if (conflict) {
      throw new AppError('A confirmed session already exists during this scheduled time window.', 409, ErrorCodes.CONFLICT);
    }

    const session = await SessionModel.create({
      mentorshipId,
      scheduledStartTime: start,
      scheduledEndTime: end,
      timeZone: input.timeZone || 'UTC',
      status: 'PROPOSED',
      proposedBy: userId as any,
      agenda: input.agenda,
      meetingLink: input.meetingLink || 'https://meet.google.com/p11-mentorship-session',
    });

    // Update last activity on mentorship
    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    return session;
  }

  async confirmSession(userId: string, sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session || session.status !== 'PROPOSED') {
      throw new AppError('Proposed session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    session.status = 'CONFIRMED';
    await session.save();

    await MentorshipModel.findByIdAndUpdate(session.mentorshipId, {
      lastMeaningfulActivityAt: new Date(),
    });

    return session;
  }

  async cancelSession(userId: string, sessionId: string, reason?: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Session not found.', 404, ErrorCodes.NOT_FOUND);
    }

    session.status = 'CANCELLED';
    session.cancellationReason = reason || 'Cancelled by participant';
    await session.save();

    return session;
  }

  async getMentorshipSessions(mentorshipId: string) {
    return SessionModel.find({ mentorshipId }).sort({ scheduledStartTime: 1 });
  }
}

export const schedulingService = new SchedulingService();

