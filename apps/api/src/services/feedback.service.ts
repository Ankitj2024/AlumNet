import { AppError, ErrorCodes } from '@p11/shared';
import { FeedbackModel } from '../models/Feedback.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';

export class FeedbackService {
  async submitFeedback(
    userId: string,
    mentorshipId: string,
    data: {
      sessionId?: string;
      recipientRole: 'MENTOR' | 'STUDENT';
      satisfactionRating: number;
      usefulnessScore: number;
      communicationQuality: number;
      textFeedback?: string;
      isAnonymousToRecipient?: boolean;
    }
  ) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
    if (!mentorship) {
      throw new AppError('Mentorship not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const feedback = await FeedbackModel.create({
      mentorshipId,
      sessionId: data.sessionId as any,
      submittedBy: userId as any,
      recipientRole: data.recipientRole,
      satisfactionRating: data.satisfactionRating,
      usefulnessScore: data.usefulnessScore,
      communicationQuality: data.communicationQuality,
      textFeedback: data.textFeedback,
      isAnonymousToRecipient: data.isAnonymousToRecipient ?? false,
    });

    return feedback;
  }

  async getMentorshipFeedback(mentorshipId: string) {
    return FeedbackModel.find({ mentorshipId }).sort({ createdAt: -1 });
  }
}

export const feedbackService = new FeedbackService();

