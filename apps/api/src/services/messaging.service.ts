import { Types } from 'mongoose';
import { AppError, ErrorCodes, scanPrivacyShieldV2 } from '@p11/shared';
import { MessageModel } from '../models/Message.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { SessionModel } from '../models/Session.model.js';
import { UserModel } from '../models/User.model.js';
import { encryptMessage, decryptMessage } from '../utils/crypto.util.js';
import { auditService } from './audit.service.js';

export class MessagingService {
  /**
   * Send in-platform message with Privacy Shield V2 & AES-256-GCM encryption
   */
  async sendMessage(userId: string, mentorshipId: string, rawContent: string) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
    if (!mentorship || mentorship.status !== 'ACTIVE') {
      throw new AppError('Active mentorship is required for in-platform messaging.', 400, ErrorCodes.BAD_REQUEST);
    }

    if (!rawContent || !rawContent.trim()) {
      throw new AppError('Message content cannot be empty.', 400, ErrorCodes.BAD_REQUEST);
    }

    // 1. Check if Mutual Contact Sharing is Unlocked (requires >= 3 completed sessions)
    const completedSessionsCount = await SessionModel.countDocuments({
      mentorshipId: new Types.ObjectId(mentorshipId),
      status: 'COMPLETED',
    });
    const isMutualContactUnlocked = completedSessionsCount >= 3;

    let cleanText = rawContent;
    let isRedacted = false;
    let detectedTypes: string[] = [];
    let senderWarning: string | undefined;

    if (isMutualContactUnlocked) {
      // Mutual contact sharing unlocked after 3 successful sessions!
      cleanText = rawContent;
      isRedacted = false;
    } else {
      // 2. Progressive Sanctions: Check for 3 filter bypass violations in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentViolations = await MessageModel.countDocuments({
        senderId: new Types.ObjectId(userId),
        isRedacted: true,
        createdAt: { $gte: oneDayAgo },
      });

      if (recentViolations >= 3) {
        throw new AppError(
          'Your account has been placed in read-only messaging mode for 24 hours due to 3 repeated attempts to bypass privacy filters.',
          429,
          ErrorCodes.THROTTLE_LIMIT_REACHED
        );
      }

      // 3. Privacy Shield V2 Redaction Filter
      const scanResult = scanPrivacyShieldV2(rawContent);
      if (scanResult.hasPII) {
        isRedacted = true;
        cleanText = scanResult.cleanText;
        detectedTypes = scanResult.detectedTypes;
        senderWarning = 'Contact details detected and hidden from recipient.';
      }
    }

    // 4. AES-256-GCM Encryption of original content
    const { encryptedContent, iv, authTag } = encryptMessage(rawContent);

    // 5. Store message (content is cleanText for receiver; encryptedContent preserves original)
    const message = await MessageModel.create({
      mentorshipId: new Types.ObjectId(mentorshipId),
      senderId: new Types.ObjectId(userId),
      content: cleanText,
      encryptedContent,
      iv,
      authTag,
      isRedacted,
      detectedTypes,
      senderWarning,
      isMutualContactUnlocked,
      readBy: [{ userId: new Types.ObjectId(userId), readAt: new Date() }],
    });

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    return {
      _id: message._id,
      mentorshipId: message.mentorshipId,
      senderId: message.senderId,
      content: cleanText, // Default content is redacted for receiver & backward compatibility
      originalContent: rawContent,
      cleanContent: cleanText,
      isRedacted,
      piiDetected: isRedacted,
      detectedTypes,
      piiTypesDetected: detectedTypes,
      senderWarning,
      isMutualContactUnlocked,
      createdAt: message.createdAt,
    };
  }

  /**
   * Retrieve messages: Sender views decrypted original + warning; Receiver views redacted content
   */
  async getMessages(viewerUserId: string, mentorshipId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      MessageModel.find({ mentorshipId: new Types.ObjectId(mentorshipId) })
        .populate('senderId', 'firstName lastName role')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      MessageModel.countDocuments({ mentorshipId: new Types.ObjectId(mentorshipId) }),
    ]);

    const messages = docs.map((doc) => {
      const isSender = doc.senderId && (doc.senderId as any)._id?.toString() === viewerUserId;

      if (isSender) {
        // Return original decrypted content to sender with inline warning alert if redacted
        try {
          const original = decryptMessage(doc.encryptedContent, doc.iv, doc.authTag);
          return {
            _id: doc._id,
            mentorshipId: doc.mentorshipId,
            senderId: doc.senderId,
            content: original,
            isRedacted: doc.isRedacted,
            senderWarning: doc.senderWarning,
            readBy: doc.readBy,
            createdAt: doc.createdAt,
          };
        } catch {
          return {
            _id: doc._id,
            mentorshipId: doc.mentorshipId,
            senderId: doc.senderId,
            content: doc.content,
            isRedacted: doc.isRedacted,
            senderWarning: doc.senderWarning,
            readBy: doc.readBy,
            createdAt: doc.createdAt,
          };
        }
      }

      // Receiver sees redacted content
      return {
        _id: doc._id,
        mentorshipId: doc.mentorshipId,
        senderId: doc.senderId,
        content: doc.content,
        isRedacted: doc.isRedacted,
        senderWarning: undefined,
        readBy: doc.readBy,
        createdAt: doc.createdAt,
      };
    });

    return { messages, total, page, limit };
  }

  /**
   * Decrypt message for administrative moderation queue (Strictly Audited with Reason)
   */
  async decryptForModeration(
    officerUserId: string,
    messageId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const officer = await UserModel.findById(officerUserId);
    if (
      !officer ||
      (officer.role !== 'ALUMNI_RELATIONS_OFFICER' &&
        officer.role !== 'PLACEMENT_OFFICER' &&
        officer.role !== 'SUPER_ADMIN')
    ) {
      throw new AppError('Forbidden: Only authorized university officers can inspect encrypted messages.', 403, ErrorCodes.FORBIDDEN);
    }

    if (!reason || reason.trim().length < 5) {
      throw new AppError('A valid audit reason (minimum 5 characters) is required for moderation decryption.', 400, ErrorCodes.VALIDATION_ERROR);
    }

    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new AppError('Message not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const decryptedContent = decryptMessage(message.encryptedContent, message.iv, message.authTag);

    // Log to institutional audit ledger
    await auditService.log({
      actorId: officerUserId,
      actorRole: officer.role,
      action: 'SECURITY_MESSAGE_DECRYPTED_FOR_MODERATION',
      entityType: 'Message',
      entityId: messageId,
      ipAddress,
      userAgent,
      metadata: {
        reason,
        mentorshipId: message.mentorshipId.toString(),
        detectedTypes: message.detectedTypes,
        isRedacted: message.isRedacted,
      },
    });

    return {
      messageId: message._id,
      decryptedContent,
      isRedacted: message.isRedacted,
      detectedTypes: message.detectedTypes,
      justification: reason,
      auditedBy: `${officer.firstName} ${officer.lastName}`,
      auditedAt: new Date(),
    };
  }

  async markAsRead(userId: string, mentorshipId: string) {
    await MessageModel.updateMany(
      {
        mentorshipId: new Types.ObjectId(mentorshipId),
        'readBy.userId': { $ne: new Types.ObjectId(userId) },
      },
      {
        $push: { readBy: { userId: new Types.ObjectId(userId), readAt: new Date() } },
      }
    );
    return { success: true };
  }
}

export const messagingService = new MessagingService();
