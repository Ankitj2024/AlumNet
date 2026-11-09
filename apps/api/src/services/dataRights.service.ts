import { Types } from 'mongoose';
import { UserModel } from '../models/User.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { AlumnusModel } from '../models/Alumnus.model.js';
import { MentorshipRequestModel } from '../models/MentorshipRequest.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { SessionModel } from '../models/Session.model.js';
import { GoalModel } from '../models/Goal.model.js';
import { ActionItemModel } from '../models/ActionItem.model.js';
import { MessageModel } from '../models/Message.model.js';
import { FeedbackModel } from '../models/Feedback.model.js';
import { NotificationModel } from '../models/Notification.model.js';
import { NotificationPreferenceModel } from '../models/NotificationPreference.model.js';
import { PlacementRecordModel } from '../models/PlacementRecord.model.js';
import { MentorCapacityModel } from '../models/MentorCapacity.model.js';
import { RefreshTokenModel } from '../models/RefreshToken.model.js';
import { AuditLogModel } from '../models/AuditLog.model.js';
import { decryptMessage } from '../utils/crypto.util.js';
import { AppError, ErrorCodes } from '@p11/shared';
import { Clock, SystemClock } from '../jobs/backgroundJobs.js';

export class DataRightsService {
  /**
   * GDPR / DPDP Article 20: Export complete machine-readable bundle of all user data
   */
  async exportUserData(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const user = await UserModel.findById(userObjectId)
      .select('-passwordHash -emailVerificationToken -passwordResetToken -passwordResetExpires -mfaSecret')
      .lean();

    if (!user) {
      throw new AppError('User account not found.', 404, ErrorCodes.NOT_FOUND);
    }

    // Concurrent lookup of all user-associated entities across the platform
    const [
      studentProfile,
      alumnusProfile,
      mentorCapacity,
      sentRequests,
      receivedRequests,
      mentorshipsAsStudent,
      mentorshipsAsMentor,
      sentMessages,
      sessions,
      goals,
      actionItems,
      feedbackList,
      placementRecords,
      notifications,
      notificationPreferences,
    ] = await Promise.all([
      StudentProfileModel.findOne({ userId: userObjectId }).lean(),
      AlumnusModel.findOne({ userId: userObjectId }).lean(),
      MentorCapacityModel.findOne({ userId: userObjectId }).lean(),
      MentorshipRequestModel.find({ studentId: userObjectId }).lean(),
      MentorshipRequestModel.find({ mentorId: userObjectId }).lean(),
      MentorshipModel.find({ studentId: userObjectId }).lean(),
      MentorshipModel.find({ mentorId: userObjectId }).lean(),
      MessageModel.find({ senderId: userObjectId }).lean(),
      SessionModel.find({ proposedBy: userObjectId }).lean(),
      GoalModel.find({ createdBy: userObjectId }).lean(),
      ActionItemModel.find({ assignedTo: userObjectId }).lean(),
      FeedbackModel.find({ submittedBy: userObjectId }).lean(),
      PlacementRecordModel.find({ studentId: userObjectId }).lean(),
      NotificationModel.find({ userId: userObjectId }).lean(),
      NotificationPreferenceModel.findOne({ userId: userObjectId }).lean(),
    ]);

    // Decrypt messages sent by this user for personal data portability
    const decryptedMessages = sentMessages.map((msg) => {
      let plaintext = msg.content;
      try {
        if (msg.encryptedContent && msg.iv && msg.authTag) {
          plaintext = decryptMessage(msg.encryptedContent, msg.iv, msg.authTag);
        }
      } catch {
        plaintext = msg.content;
      }
      return {
        _id: msg._id,
        mentorshipId: msg.mentorshipId,
        content: plaintext,
        isRedacted: msg.isRedacted,
        detectedTypes: msg.detectedTypes,
        createdAt: msg.createdAt,
      };
    });

    return {
      metadata: {
        exportVersion: '2.0.0',
        exportedAt: new Date().toISOString(),
        regulationCompliance: ['GDPR Article 20 (Right to Data Portability)', 'India DPDP Act Section 12'],
        platform: 'P11 Verified Alumni Mentorship & Engagement Platform',
      },
      user,
      profile: user.role === 'STUDENT' ? studentProfile : alumnusProfile,
      mentorCapacity: user.role === 'ALUMNI_MENTOR' ? mentorCapacity : undefined,
      mentorshipRequests: {
        sent: sentRequests,
        received: receivedRequests,
      },
      mentorships: {
        asStudent: mentorshipsAsStudent,
        asMentor: mentorshipsAsMentor,
      },
      sessions,
      careerGoals: goals,
      actionItems,
      sentMessages: decryptedMessages,
      feedback: feedbackList,
      placementRecords,
      notifications,
      notificationPreferences,
    };
  }

  /**
   * GDPR / DPDP Article 17: Request Account Erasure (Soft delete with 30-day grace period)
   */
  async requestAccountDeletion(userId: string, clock: Clock = new SystemClock()) {
    const userObjectId = new Types.ObjectId(userId);
    const user = await UserModel.findById(userObjectId);

    if (!user) {
      throw new AppError('User not found.', 404, ErrorCodes.NOT_FOUND);
    }

    if (user.status === 'DELETED') {
      throw new AppError('Account deletion has already been scheduled.', 400, ErrorCodes.BAD_REQUEST);
    }

    const now = clock.now();
    const purgeDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    user.status = 'DELETED';
    user.deletedAt = now;
    user.purgeScheduledAt = purgeDate;
    await user.save();

    // 1. Immediately revoke all active sessions / refresh tokens
    await RefreshTokenModel.deleteMany({ userId: userObjectId });

    // 2. If Mentor: Pause capacity and mark profile unsearchable
    if (user.role === 'ALUMNI_MENTOR') {
      const alumnus = await AlumnusModel.findOneAndUpdate(
        { userId: userObjectId },
        { isSearchable: false }
      );
      if (alumnus) {
        await MentorCapacityModel.updateOne(
          { mentorId: alumnus._id },
          { isPaused: true }
        );
        // Auto-cancel pending incoming requests
        await MentorshipRequestModel.updateMany(
          { mentorId: alumnus._id, status: 'PENDING' },
          { status: 'DECLINED', declineReason: 'Mentor account is undergoing scheduled closure.' }
        );
      }
    }

    // 3. If Student: Cancel pending requests to free mentor capacity
    if (user.role === 'STUDENT') {
      await MentorshipRequestModel.updateMany(
        { studentId: userObjectId, status: 'PENDING' },
        { status: 'EXPIRED' }
      );
    }

    // 4. Audit Log
    await AuditLogModel.create({
      actorId: userObjectId,
      actorRole: user.role,
      action: 'ACCOUNT_DELETION_SCHEDULED',
      entityType: 'User',
      entityId: userId,
      metadata: {
        scheduledPurgeDate: purgeDate.toISOString(),
        gracePeriodDays: 30,
      },
      timestamp: now,
    });

    return {
      message: 'Account scheduled for permanent erasure in 30 days. All active sessions have been terminated.',
      deletedAt: now,
      purgeScheduledAt: purgeDate,
    };
  }

  /**
   * Cancel scheduled deletion if requested within 30 days
   */
  async cancelAccountDeletion(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user || user.status !== 'DELETED') {
      throw new AppError('Account is not scheduled for deletion.', 400, ErrorCodes.BAD_REQUEST);
    }

    user.status = 'ACTIVE';
    user.deletedAt = undefined;
    user.purgeScheduledAt = undefined;
    await user.save();

    if (user.role === 'ALUMNI_MENTOR') {
      const alumnus = await AlumnusModel.findOneAndUpdate(
        { userId: user._id },
        { isSearchable: true }
      );
      if (alumnus) {
        await MentorCapacityModel.updateOne(
          { mentorId: alumnus._id },
          { isPaused: false }
        );
      }
    }

    await AuditLogModel.create({
      actorId: user._id,
      actorRole: user.role,
      action: 'ACCOUNT_DELETION_CANCELLED',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { restoredAt: new Date().toISOString() },
      timestamp: new Date(),
    });

    return {
      message: 'Account deletion has been cancelled. Your profile is restored to active status.',
      status: 'ACTIVE',
    };
  }

  /**
   * Background Purge Job: Permanently purge/anonymize soft-deleted accounts > 30 days
   */
  async purgeExpiredAccounts(clock: Clock = new SystemClock()) {
    const now = clock.now();

    const expiredUsers = await UserModel.find({
      status: 'DELETED',
      purgeScheduledAt: { $lte: now },
    });

    let purgedCount = 0;

    for (const user of expiredUsers) {
      // 1. Permanently remove credentials, tokens, and PII
      user.email = `anonymized-${user._id}@purged.local`;
      user.firstName = 'Deleted';
      user.lastName = 'User';
      user.passwordHash = 'PURGED';
      user.isEmailVerified = false;
      user.status = 'DEACTIVATED';
      user.purgeScheduledAt = undefined;
      await user.save();

      // 2. Cascade delete sensitive personal tokens and preferences
      await Promise.all([
        RefreshTokenModel.deleteMany({ userId: user._id }),
        NotificationModel.deleteMany({ userId: user._id }),
        NotificationPreferenceModel.deleteMany({ userId: user._id }),
      ]);

      // 3. Audit permanent purge
      await AuditLogModel.create({
        action: 'ACCOUNT_PERMANENTLY_PURGED',
        entityType: 'User',
        entityId: user._id.toString(),
        metadata: {
          purgedAt: now.toISOString(),
          priorDeletedAt: user.deletedAt?.toISOString(),
        },
        timestamp: now,
      });

      purgedCount++;
    }

    return { purgedCount };
  }
}

export const dataRightsService = new DataRightsService();
