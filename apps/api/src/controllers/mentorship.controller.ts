import { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse, ErrorCodes } from '@p11/shared';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { AlumnusModel } from '../models/Alumnus.model.js';
import { mentorshipRequestService } from '../services/mentorshipRequest.service.js';
import { schedulingService } from '../services/scheduling.service.js';
import { goalsService } from '../services/goals.service.js';
import { feedbackService } from '../services/feedback.service.js';

export class MentorshipController {
  async getMyMentorships(req: Request, res: Response) {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let filter: any = {};
    if (role === 'STUDENT') {
      const student = await StudentProfileModel.findOne({ userId });
      if (!student) return res.status(200).json(createSuccessResponse([]));
      filter.studentId = student._id;
    } else if (role === 'ALUMNI_MENTOR') {
      const mentor = await AlumnusModel.findOne({ userId });
      if (!mentor) return res.status(200).json(createSuccessResponse([]));
      filter.mentorId = mentor._id;
    }

    const mentorships = await MentorshipModel.find(filter)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      })
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json(createSuccessResponse(mentorships));
  }

  async getMentorshipDetails(req: Request, res: Response) {
    const mentorship = await MentorshipModel.findById(req.params.id)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'firstName lastName' },
      });

    const [sessions, goals, feedback] = await Promise.all([
      schedulingService.getMentorshipSessions(req.params.id),
      goalsService.getMentorshipGoals(req.params.id),
      feedbackService.getMentorshipFeedback(req.params.id),
    ]);

    const isMentor = req.user?.role === 'ALUMNI_MENTOR';
    const sanitizedSessions = sessions.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      if (!isMentor) {
        delete obj.mentorNotes;
      }
      return obj;
    });

    res.status(200).json(
      createSuccessResponse({
        mentorship,
        sessions: sanitizedSessions,
        goals,
        feedback,
      })
    );
  }

  async getSessions(req: Request, res: Response) {
    const mentorship = await MentorshipModel.findById(req.params.id);
    if (!mentorship) {
      return res.status(404).json(createErrorResponse(ErrorCodes.NOT_FOUND, 'Mentorship not found'));
    }
    const isMentor = req.user?.role === 'ALUMNI_MENTOR';
    const sessions = await schedulingService.getMentorshipSessions(req.params.id);
    const sanitized = sessions.map((s) => {
      const obj = s.toObject ? s.toObject() : { ...s };
      if (!isMentor) {
        delete obj.mentorNotes;
      }
      return obj;
    });
    res.status(200).json(createSuccessResponse(sanitized));
  }

  async close(req: Request, res: Response) {
    const result = await mentorshipRequestService.closeMentorship(
      req.user!.userId,
      req.params.id,
      req.body?.closureReason
    );
    res.status(200).json(createSuccessResponse(result));
  }

  // Session management
  async proposeSession(req: Request, res: Response) {
    const result = await schedulingService.proposeSession(
      req.user!.userId,
      req.params.id,
      req.body
    );
    res.status(201).json(createSuccessResponse(result));
  }

  async confirmSession(req: Request, res: Response) {
    const result = await schedulingService.confirmSession(
      req.user!.userId,
      req.params.sessionId
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async cancelSession(req: Request, res: Response) {
    const result = await schedulingService.cancelSession(
      req.user!.userId,
      req.params.sessionId,
      req.body?.reason
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async rescheduleSession(req: Request, res: Response) {
    const result = await schedulingService.rescheduleSession(
      req.user!.userId,
      req.params.sessionId,
      req.body
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async recordNoShow(req: Request, res: Response) {
    const result = await schedulingService.recordNoShow(
      req.user!.userId,
      req.params.sessionId,
      req.body?.notes
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async recordSessionNotes(req: Request, res: Response) {
    const result = await schedulingService.recordSessionNotes(
      req.user!.userId,
      req.params.sessionId,
      req.body
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async submitStudentRating(req: Request, res: Response) {
    const result = await schedulingService.submitStudentRating(
      req.user!.userId,
      req.params.sessionId,
      req.body
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async downloadIcs(req: Request, res: Response) {
    const icsContent = await schedulingService.generateIcsFile(req.params.sessionId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mentorship-session-${req.params.sessionId}.ics"`
    );
    res.send(icsContent);
  }

  // Goals & Action Items
  async createGoal(req: Request, res: Response) {
    const result = await goalsService.createGoal(
      req.user!.userId,
      req.params.id,
      req.body
    );
    res.status(201).json(createSuccessResponse(result));
  }

  async updateGoal(req: Request, res: Response) {
    const result = await goalsService.updateGoalProgress(
      req.params.goalId,
      req.body.progressPercentage
    );
    res.status(200).json(createSuccessResponse(result));
  }

  async createActionItem(req: Request, res: Response) {
    const result = await goalsService.createActionItem(
      req.user!.userId,
      req.params.id,
      req.params.goalId,
      req.body
    );
    res.status(201).json(createSuccessResponse(result));
  }

  async toggleActionItem(req: Request, res: Response) {
    const result = await goalsService.toggleActionItem(req.params.itemId);
    res.status(200).json(createSuccessResponse(result));
  }

  // Feedback
  async submitFeedback(req: Request, res: Response) {
    const result = await feedbackService.submitFeedback(
      req.user!.userId,
      req.params.id,
      req.body
    );
    res.status(201).json(createSuccessResponse(result));
  }
}

export const mentorshipController = new MentorshipController();

