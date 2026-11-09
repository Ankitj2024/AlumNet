import { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { MentorshipRequestModel } from '../models/MentorshipRequest.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { MentorCapacityModel } from '../models/MentorCapacity.model.js';
import { AlumnusModel } from '../models/Alumnus.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { SessionModel } from '../models/Session.model.js';
import { notificationService } from '../services/notification.service.js';

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class ManualClock implements Clock {
  private currentTime: Date;

  constructor(initialTime: Date = new Date()) {
    this.currentTime = new Date(initialTime);
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  advanceDays(days: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + days * 24 * 60 * 60 * 1000);
  }

  advanceHours(hours: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + hours * 60 * 60 * 1000);
  }

  advanceMinutes(minutes: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
  }

  setTime(time: Date): void {
    this.currentTime = new Date(time);
  }
}

/**
 * 1. expireRequests: PENDING requests past expiry become EXPIRED
 */
export async function expireRequestsJob(clock: Clock = new SystemClock()) {
  const currentTime = clock.now();
  const expiredRequests = await MentorshipRequestModel.find({
    status: 'PENDING',
    expiresAt: { $lte: currentTime },
  }).populate('studentId').populate('mentorId');

  let expiredCount = 0;

  for (const req of expiredRequests) {
    req.status = 'EXPIRED';
    req.respondedAt = currentTime;
    req.declineReason = 'Request auto-expired: no mentor response received within response window.';
    await req.save();
    expiredCount++;

    const studentUser = (req.studentId as any)?.userId;
    const mentorUser = (req.mentorId as any)?.userId;

    if (studentUser) {
      await notificationService.sendNotification({
        userId: studentUser,
        type: 'REQUEST_EXPIRED',
        title: 'Mentorship Request Expired',
        message: 'Your mentorship outreach has expired without an active confirmation. You may explore and request other mentors.',
        metadata: { requestId: req._id.toString() },
        idempotencyKey: `notif:req_expired:student:${req._id.toString()}`,
      });
    }

    if (mentorUser) {
      await notificationService.sendNotification({
        userId: mentorUser,
        type: 'REQUEST_EXPIRED',
        title: 'Pending Request Expired',
        message: 'A student mentorship outreach has passed the response window and has been marked as expired.',
        metadata: { requestId: req._id.toString() },
        idempotencyKey: `notif:req_expired:mentor:${req._id.toString()}`,
      });
    }
  }

  logger.info(`[Background Job] expireRequests completed. Expired ${expiredCount} requests.`);
  return { expiredCount };
}

/**
 * 2. autoCancelOnFull: Remaining PENDING requests become AUTO_CANCELLED when mentor is full
 */
export async function autoCancelOnFullJob(mentorId: string, clock: Clock = new SystemClock()) {
  const currentTime = clock.now();
  const mentorObjectId = new Types.ObjectId(mentorId);

  const pendingRequests = await MentorshipRequestModel.find({
    mentorId: mentorObjectId,
    status: 'PENDING',
  }).populate('studentId');

  let cancelledCount = 0;

  // Find 2 alternative verified mentors with capacity
  const alternativeMentors = await AlumnusModel.find({
    _id: { $ne: mentorObjectId },
    verificationStatus: 'VERIFIED',
    isSearchable: true,
  }).limit(3);

  const altList = alternativeMentors.map((m) => ({
    mentorId: m._id.toString(),
    designation: m.professionalDesignation,
    organisation: m.organisation,
  }));

  for (const req of pendingRequests) {
    req.status = 'AUTO_CANCELLED';
    req.declineReason = 'Mentor has reached maximum active mentee capacity.';
    req.respondedAt = currentTime;
    await req.save();
    cancelledCount++;

    const studentUser = (req.studentId as any)?.userId;
    if (studentUser) {
      await notificationService.sendNotification({
        userId: studentUser,
        type: 'REQUEST_AUTO_CANCELLED',
        title: 'Mentor Capacity Reached',
        message: 'The mentor you requested has accepted their maximum active mentees. Your pending request has been automatically cancelled to free up your request quota. Explore recommended alternative mentors.',
        metadata: {
          requestId: req._id.toString(),
          alternativeMentors: altList,
        },
        idempotencyKey: `notif:auto_cancel:${req._id.toString()}`,
      });
    }
  }

  logger.info(`[Background Job] autoCancelOnFull for mentor ${mentorId}: cancelled ${cancelledCount} requests.`);
  return { cancelledCount };
}

/**
 * 3. recomputeHealth: HEALTHY <=14d, AT_RISK 15-28d, DORMANT >28d (7-day grace then closure)
 */
export async function recomputeHealthJob(clock: Clock = new SystemClock()) {
  const currentTime = clock.now();
  const activeMentorships = await MentorshipModel.find({
    status: 'ACTIVE',
  }).populate('studentId').populate('mentorId');

  let healthyCount = 0;
  let atRiskCount = 0;
  let dormantCount = 0;
  let closedCount = 0;

  for (const m of activeMentorships) {
    const lastActivity = m.lastMeaningfulActivityAt || m.startDate || m.createdAt;
    const diffMs = currentTime.getTime() - lastActivity.getTime();
    const daysInactive = diffMs / (1000 * 60 * 60 * 24);

    const studentUser = (m.studentId as any)?.userId;
    const mentorUser = (m.mentorId as any)?.userId;

    if (daysInactive <= 14) {
      // HEALTHY <= 14 days
      m.healthStatus = 'HEALTHY';
      m.dormantEnteredAt = undefined;
      healthyCount++;
    } else if (daysInactive > 14 && daysInactive <= 28) {
      // AT_RISK 15 to 28 days
      m.healthStatus = 'AT_RISK';
      m.dormantEnteredAt = undefined;
      atRiskCount++;

      // Health Nudge: max once every 7 days
      const lastNudge = m.lastNudgeAt;
      const canNudge = !lastNudge || (currentTime.getTime() - lastNudge.getTime()) >= 7 * 24 * 60 * 60 * 1000;

      if (canNudge) {
        m.lastNudgeAt = currentTime;

        if (studentUser) {
          await notificationService.sendNotification({
            userId: studentUser,
            type: 'HEALTH_NUDGE',
            title: 'Keep Your Mentorship Momentum Going!',
            message: 'It has been over 14 days since your last session or message with your mentor. Reach out to schedule your next milestone check-in.',
            metadata: { mentorshipId: m._id.toString() },
            idempotencyKey: `notif:nudge:student:${m._id.toString()}:${Math.floor(currentTime.getTime() / (7 * 24 * 3600 * 1000))}`,
          });
        }

        if (mentorUser) {
          await notificationService.sendNotification({
            userId: mentorUser,
            type: 'HEALTH_NUDGE',
            title: 'Mentorship Check-In Reminder',
            message: 'No recent activity recorded with your mentee in the last 14 days. Suggest an upcoming discussion topic or availability slot.',
            metadata: { mentorshipId: m._id.toString() },
            idempotencyKey: `notif:nudge:mentor:${m._id.toString()}:${Math.floor(currentTime.getTime() / (7 * 24 * 3600 * 1000))}`,
          });
        }
      }
    } else {
      // DORMANT > 28 days
      m.healthStatus = 'DORMANT';
      dormantCount++;

      if (!m.dormantEnteredAt) {
        m.dormantEnteredAt = currentTime;
      }

      // Check 7-day grace period
      const daysInDormancy = (currentTime.getTime() - m.dormantEnteredAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysInDormancy >= 7) {
        // Close mentorship & atomically decrement mentor capacity
        m.status = 'TERMINATED';
        m.closureReason = 'Automated closure: relationship inactive for over 28 days and 7-day grace period elapsed without engagement.';
        m.endDate = currentTime;
        closedCount++;

        // Decrement capacity
        await MentorCapacityModel.updateOne(
          { mentorId: m.mentorId, currentActiveMentees: { $gt: 0 } },
          {
            $inc: { currentActiveMentees: -1 },
            $set: { isAcceptingRequests: true, lastUpdated: currentTime },
          }
        );

        if (studentUser) {
          await notificationService.sendNotification({
            userId: studentUser,
            type: 'REQUEST_EXPIRED',
            title: 'Mentorship Closed Due to Inactivity',
            message: 'Your mentorship relationship has been gracefully closed due to 35+ days of dormancy. Your mentee slot has been released.',
            metadata: { mentorshipId: m._id.toString() },
            idempotencyKey: `notif:closed:student:${m._id.toString()}`,
          });
        }

        if (mentorUser) {
          await notificationService.sendNotification({
            userId: mentorUser,
            type: 'REQUEST_EXPIRED',
            title: 'Mentee Slot Released',
            message: 'An inactive mentorship relationship was closed after the dormancy grace period. Your active capacity has been restored.',
            metadata: { mentorshipId: m._id.toString() },
            idempotencyKey: `notif:closed:mentor:${m._id.toString()}`,
          });
        }
      }
    }

    await m.save();
  }

  logger.info(
    `[Background Job] recomputeHealth: healthy=${healthyCount}, atRisk=${atRiskCount}, dormant=${dormantCount}, closed=${closedCount}`
  );

  return { healthyCount, atRiskCount, dormantCount, closedCount };
}

/**
 * 4. reconcileCapacity: Recompute active counts from Mentorship rows, log and fix drift
 */
export async function reconcileCapacityJob(clock: Clock = new SystemClock()) {
  const currentTime = clock.now();
  const capacities = await MentorCapacityModel.find();

  let reconciledMentors = 0;
  let driftsCorrected = 0;

  for (const cap of capacities) {
    const actualActiveCount = await MentorshipModel.countDocuments({
      mentorId: cap.mentorId,
      status: { $in: ['ACTIVE', 'PAUSED'] },
    });

    if (cap.currentActiveMentees !== actualActiveCount) {
      logger.warn(
        `[Capacity Drift Detected] Mentor ${cap.mentorId}: stored=${cap.currentActiveMentees}, actual=${actualActiveCount}. Correcting drift.`
      );

      cap.currentActiveMentees = actualActiveCount;
      if (!cap.isPaused) {
        cap.isAcceptingRequests = actualActiveCount < cap.maxActiveMentees;
      }
      cap.lastUpdated = currentTime;
      await cap.save();
      driftsCorrected++;
    }

    reconciledMentors++;
  }

  logger.info(
    `[Background Job] reconcileCapacity completed. Checked ${reconciledMentors} mentors, corrected ${driftsCorrected} drifts.`
  );
  return { reconciledMentors, driftsCorrected };
}

/**
 * 5. resumePausedMentors: Auto-resume when pausedUntil passes
 */
export async function resumePausedMentorsJob(clock: Clock = new SystemClock()) {
  const currentTime = clock.now();
  const pausedMentors = await MentorCapacityModel.find({
    isPaused: true,
    pausedUntil: { $lte: currentTime },
  }).populate('mentorId');

  let resumedCount = 0;

  for (const cap of pausedMentors) {
    cap.isPaused = false;
    cap.pausedUntil = undefined;
    cap.pauseReason = undefined;
    cap.isAcceptingRequests = cap.currentActiveMentees < cap.maxActiveMentees;
    cap.lastUpdated = currentTime;
    await cap.save();

    // Update alumnus searchability
    await AlumnusModel.updateOne(
      { _id: cap.mentorId },
      { $set: { isSearchable: cap.isAcceptingRequests } }
    );

    resumedCount++;

    const mentorUser = (cap.mentorId as any)?.userId;
    if (mentorUser) {
      await notificationService.sendNotification({
        userId: mentorUser,
        type: 'CAPACITY_FULL',
        title: 'Mentorship Availability Resumed',
        message: 'Your scheduled pause period has completed. Your profile has been automatically resumed for mentorship requests.',
        metadata: { mentorId: cap.mentorId.toString() },
        idempotencyKey: `notif:resumed:${cap.mentorId.toString()}:${currentTime.toDateString()}`,
      });
    }
  }

  logger.info(`[Background Job] resumePausedMentors completed. Resumed ${resumedCount} mentors.`);
  return { resumedCount };
}

/**
 * 6. sessionReminders: 24h and 1h before confirmed sessions
 */
export async function sessionRemindersJob(clock: Clock = new SystemClock()) {
  const currentTime = clock.now();

  // 24h reminders: sessions starting in 23h to 25h
  const window24hStart = new Date(currentTime.getTime() + 23 * 60 * 60 * 1000);
  const window24hEnd = new Date(currentTime.getTime() + 25 * 60 * 60 * 1000);

  const sessions24h = await SessionModel.find({
    status: 'CONFIRMED',
    reminded24h: { $ne: true },
    scheduledStartTime: { $gte: window24hStart, $lte: window24hEnd },
  }).populate({
    path: 'mentorshipId',
    populate: [{ path: 'studentId' }, { path: 'mentorId' }],
  });

  let reminders24hSent = 0;

  for (const session of sessions24h) {
    session.reminded24h = true;
    await session.save();
    reminders24hSent++;

    const mentorship = session.mentorshipId as any;
    const studentUser = mentorship?.studentId?.userId;
    const mentorUser = mentorship?.mentorId?.userId;

    const sessionMsg = `Reminder: You have an upcoming mentorship session in 24 hours (at ${new Date(session.scheduledStartTime).toLocaleTimeString()}). Meeting link: ${session.meetingLink || 'To be provided'}`;

    if (studentUser) {
      await notificationService.sendNotification({
        userId: studentUser,
        type: 'SESSION_REMINDER',
        title: 'Upcoming Mentorship Session in 24h',
        message: sessionMsg,
        metadata: { sessionId: session._id.toString(), link: session.meetingLink },
        idempotencyKey: `notif:remind24h:student:${session._id.toString()}`,
      });
    }

    if (mentorUser) {
      await notificationService.sendNotification({
        userId: mentorUser,
        type: 'SESSION_REMINDER',
        title: 'Upcoming Mentorship Session in 24h',
        message: sessionMsg,
        metadata: { sessionId: session._id.toString(), link: session.meetingLink },
        idempotencyKey: `notif:remind24h:mentor:${session._id.toString()}`,
      });
    }
  }

  // 1h reminders: sessions starting in 45m to 75m
  const window1hStart = new Date(currentTime.getTime() + 45 * 60 * 1000);
  const window1hEnd = new Date(currentTime.getTime() + 75 * 60 * 1000);

  const sessions1h = await SessionModel.find({
    status: 'CONFIRMED',
    reminded1h: { $ne: true },
    scheduledStartTime: { $gte: window1hStart, $lte: window1hEnd },
  }).populate({
    path: 'mentorshipId',
    populate: [{ path: 'studentId' }, { path: 'mentorId' }],
  });

  let reminders1hSent = 0;

  for (const session of sessions1h) {
    session.reminded1h = true;
    await session.save();
    reminders1hSent++;

    const mentorship = session.mentorshipId as any;
    const studentUser = mentorship?.studentId?.userId;
    const mentorUser = mentorship?.mentorId?.userId;

    const sessionMsg = `Final reminder: Your mentorship session starts in 1 hour! Link: ${session.meetingLink || 'Pending'}`;

    if (studentUser) {
      await notificationService.sendNotification({
        userId: studentUser,
        type: 'SESSION_REMINDER',
        title: 'Session Starting in 1 Hour',
        message: sessionMsg,
        metadata: { sessionId: session._id.toString(), link: session.meetingLink },
        idempotencyKey: `notif:remind1h:student:${session._id.toString()}`,
      });
    }

    if (mentorUser) {
      await notificationService.sendNotification({
        userId: mentorUser,
        type: 'SESSION_REMINDER',
        title: 'Session Starting in 1 Hour',
        message: sessionMsg,
        metadata: { sessionId: session._id.toString(), link: session.meetingLink },
        idempotencyKey: `notif:remind1h:mentor:${session._id.toString()}`,
      });
    }
  }

  logger.info(
    `[Background Job] sessionReminders completed: 24h=${reminders24hSent}, 1h=${reminders1hSent}`
  );
  return { reminders24hSent, reminders1hSent };
}

/**
 * 7. purgeDeletedAccounts: Permanently purges and anonymizes accounts past 30-day grace period
 */
export async function purgeDeletedAccountsJob(clock: Clock = new SystemClock()) {
  const { dataRightsService } = await import('../services/dataRights.service.js');
  const result = await dataRightsService.purgeExpiredAccounts(clock);
  logger.info(`[Background Job] purgeDeletedAccounts completed: purged=${result.purgedCount}`);
  return result;
}
