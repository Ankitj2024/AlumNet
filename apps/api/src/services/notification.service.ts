import nodemailer, { Transporter } from 'nodemailer';
import { Types } from 'mongoose';
import { env } from '@p11/config';
import { logger } from '../config/logger.js';
import {
  NotificationModel,
  INotificationDocument,
  NotificationType,
} from '../models/Notification.model.js';
import {
  NotificationPreferenceModel,
  INotificationPreferenceDocument,
} from '../models/NotificationPreference.model.js';
import { UserModel } from '../models/User.model.js';
import { getSocketIO } from '../utils/socket.util.js';

export interface SendNotificationOptions {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  forceEmail?: boolean;
}

export class NotificationService {
  private mailTransporter: Transporter | null = null;

  constructor() {
    this.initMailTransporter();
  }

  private initMailTransporter() {
    try {
      if (env.EMAIL_DRIVER === 'mock' || env.NODE_ENV === 'test') {
        logger.info('[NotificationService] Using Mock Email Transporter');
        return;
      }

      this.mailTransporter = nodemailer.createTransport({
        host: env.SMTP_HOST || 'localhost',
        port: Number(env.SMTP_PORT) || 1025,
        secure: Number(env.SMTP_PORT) === 465,
        auth:
          env.SMTP_USER && env.SMTP_PASS
            ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
              }
            : undefined,
      });

      logger.info(
        `[NotificationService] Mail transporter configured (${env.EMAIL_DRIVER}) at ${env.SMTP_HOST}:${env.SMTP_PORT}`
      );
    } catch (err: any) {
      logger.warn(`[NotificationService] Failed to initialize mail transporter: ${err.message}`);
    }
  }

  /**
   * Dispatch in-app and email notification with idempotency protection
   */
  async sendNotification(options: SendNotificationOptions): Promise<INotificationDocument | null> {
    const { userId, type, title, message, metadata, idempotencyKey, forceEmail } = options;
    const uid = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await NotificationModel.findOne({ idempotencyKey });
      if (existing) {
        logger.debug(`[NotificationService] Duplicate notification suppressed for key: ${idempotencyKey}`);
        return existing;
      }
    }

    // 2. Fetch User & Preferences
    const user = await UserModel.findById(uid);
    if (!user) {
      logger.warn(`[NotificationService] Attempted to notify non-existent user: ${uid}`);
      return null;
    }

    let prefs = await NotificationPreferenceModel.findOne({ userId: uid });
    if (!prefs) {
      prefs = await NotificationPreferenceModel.create({
        userId: uid,
        emailNotifications: true,
        inAppNotifications: true,
        sessionReminders: true,
        healthNudges: true,
      });
    }

    // 3. Create In-App Notification Record
    const notification = await NotificationModel.create({
      userId: uid,
      type,
      title,
      message,
      metadata: metadata || {},
      isRead: false,
      idempotencyKey,
    });

    // 4. Real-Time Socket Emission
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user:${uid.toString()}`).emit('notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        });
      }
    } catch (err: any) {
      logger.warn(`[NotificationService] Realtime socket emission failed: ${err.message}`);
    }

    // 5. Email Dispatch (Transactional emails are never disabled)
    const isTransactional =
      forceEmail ||
      type === 'REQUEST_RECEIVED' ||
      type === 'REQUEST_ACCEPTED' ||
      type === 'REQUEST_DECLINED' ||
      type === 'VERIFICATION_RESULT' ||
      type === 'REQUEST_AUTO_CANCELLED';

    const shouldSendEmail =
      isTransactional ||
      (prefs.emailNotifications &&
        (type === 'SESSION_REMINDER' ? prefs.sessionReminders : true) &&
        (type === 'HEALTH_NUDGE' ? prefs.healthNudges : true));

    if (shouldSendEmail && user.email) {
      await this.dispatchEmail(user.email, title, message);
    }

    return notification;
  }

  private async dispatchEmail(to: string, subject: string, text: string): Promise<void> {
    if (!this.mailTransporter) {
      logger.debug(`[Mock Email] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return;
    }

    try {
      await this.mailTransporter.sendMail({
        from: env.SMTP_FROM || 'AlumNet Mentorship <no-reply@alumni.edu>',
        to,
        subject,
        text,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background: #ffffff;">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 12px; color: #111;">AlumNet Institutional Mentorship</div>
            <h2 style="font-size: 18px; color: #1a1a1a; margin-top: 0;">${subject}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #444;">${text}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 11px; color: #999;">This is an official automated notification from your institutional mentorship platform.</p>
          </div>
        `,
      });
      logger.debug(`[NotificationService] Email dispatched successfully to ${to}`);
    } catch (err: any) {
      logger.warn(`[NotificationService] Failed to send email to ${to}: ${err.message}`);
    }
  }

  async getUserNotifications(userId: string, limit = 30, unreadOnly = false) {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (unreadOnly) {
      query.isRead = false;
    }
    return NotificationModel.find(query).sort({ createdAt: -1 }).limit(limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const res = await NotificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } }
    );
    return res.modifiedCount > 0;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );
    return res.modifiedCount;
  }

  async getPreferences(userId: string): Promise<INotificationPreferenceDocument> {
    let prefs = await NotificationPreferenceModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!prefs) {
      prefs = await NotificationPreferenceModel.create({
        userId: new Types.ObjectId(userId),
        emailNotifications: true,
        inAppNotifications: true,
        sessionReminders: true,
        healthNudges: true,
      });
    }
    return prefs;
  }

  async updatePreferences(
    userId: string,
    update: Partial<INotificationPreferenceDocument>
  ): Promise<INotificationPreferenceDocument> {
    const prefs = await this.getPreferences(userId);
    if (update.emailNotifications !== undefined) prefs.emailNotifications = update.emailNotifications;
    if (update.inAppNotifications !== undefined) prefs.inAppNotifications = update.inAppNotifications;
    if (update.sessionReminders !== undefined) prefs.sessionReminders = update.sessionReminders;
    if (update.healthNudges !== undefined) prefs.healthNudges = update.healthNudges;
    await prefs.save();
    return prefs;
  }
}

export const notificationService = new NotificationService();
