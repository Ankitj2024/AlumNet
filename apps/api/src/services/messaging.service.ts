import { AppError, ErrorCodes, scanAndMaskPII } from '@p11/shared';
import { MessageModel } from '../models/Message.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';

export class MessagingService {
  async sendMessage(userId: string, mentorshipId: string, content: string) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
    if (!mentorship || mentorship.status !== 'ACTIVE') {
      throw new AppError('Active mentorship is required for in-platform messaging.', 400, ErrorCodes.BAD_REQUEST);
    }

    if (!content || !content.trim()) {
      throw new AppError('Message content cannot be empty.', 400, ErrorCodes.BAD_REQUEST);
    }

    // PII Screening Engine: Detect and mask email, phone numbers, and external chat links
    const scanResult = scanAndMaskPII(content);

    const message = await MessageModel.create({
      mentorshipId,
      senderId: userId as any,
      content: scanResult.cleanText,
      piiDetected: scanResult.hasPII,
      piiTypesDetected: scanResult.detectedTypes,
      readBy: [{ userId: userId as any, readAt: new Date() }],
    });

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    return message;
  }

  async getMessages(mentorshipId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      MessageModel.find({ mentorshipId })
        .populate('senderId', 'firstName lastName role')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      MessageModel.countDocuments({ mentorshipId }),
    ]);

    return { messages, total, page, limit };
  }

  async markAsRead(userId: string, mentorshipId: string) {
    await MessageModel.updateMany(
      {
        mentorshipId,
        'readBy.userId': { $ne: userId as any },
      },
      {
        $push: { readBy: { userId: userId as any, readAt: new Date() } },
      }
    );
    return { success: true };
  }
}

export const messagingService = new MessagingService();

