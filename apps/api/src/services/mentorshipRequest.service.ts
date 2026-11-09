import { Types } from 'mongoose';
import { CreateMentorshipRequestInput } from '@p11/validation';
import { AppError, ErrorCodes, PROGRAMME_DEFAULTS } from '@p11/shared';
import { MentorshipRequestModel } from '../models/MentorshipRequest.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';
import { MentorCapacityModel } from '../models/MentorCapacity.model.js';
import { AlumnusModel } from '../models/Alumnus.model.js';
import { StudentProfileModel } from '../models/StudentProfile.model.js';
import { programmeSettingsService } from './programmeSettings.service.js';
import { auditService } from './audit.service.js';
import { notificationService } from './notification.service.js';
import { autoCancelOnFullJob } from '../jobs/backgroundJobs.js';

export class MentorshipRequestService {
  /**
   * Submit new mentorship request from student to mentor
   */
  async createRequest(userId: string, input: CreateMentorshipRequestInput) {
    const student = await StudentProfileModel.findOne({ userId });
    if (!student) {
      throw new AppError('Student profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const mentor = await AlumnusModel.findById(input.mentorId);
    if (!mentor || mentor.verificationStatus !== 'VERIFIED') {
      throw new AppError('Mentor is not verified or does not exist.', 400, ErrorCodes.UNVERIFIED_MENTOR);
    }

    // Capacity & Availability check
    const capacity = await MentorCapacityModel.findOne({ mentorId: mentor._id });
    if (!capacity || !capacity.isAcceptingRequests || capacity.isPaused) {
      throw new AppError('Mentor is currently not accepting new mentees.', 400, ErrorCodes.CAPACITY_EXCEEDED);
    }

    if (capacity.currentActiveMentees >= capacity.maxActiveMentees) {
      throw new AppError('Mentor has reached maximum active mentee capacity.', 400, ErrorCodes.CAPACITY_EXCEEDED);
    }

    // Retrieve dynamic programme policy settings
    const settings = await programmeSettingsService.getSettings();
    const {
      maxPendingRequestsPerStudent,
      maxRequestsPerRollingPeriod,
      rollingPeriodDays,
      requestExpiryDays,
    } = settings.requestLimits;

    // 1. Throttling Check: Atomic conditional increment for max pending requests
    const updatedStudent = await StudentProfileModel.findOneAndUpdate(
      {
        _id: student._id,
        $or: [
          { pendingRequestsCount: { $lt: maxPendingRequestsPerStudent } },
          { pendingRequestsCount: { $exists: false } },
        ],
      },
      { $inc: { pendingRequestsCount: 1 } },
      { new: true }
    );

    if (!updatedStudent) {
      throw new AppError(
        `Throttled: You already have ${maxPendingRequestsPerStudent} pending requests.`,
        429,
        ErrorCodes.THROTTLE_LIMIT_REACHED
      );
    }

    let request;
    try {
      // 2. Throttling Check: Rolling window limit
      const rollingStart = new Date(Date.now() - rollingPeriodDays * 24 * 60 * 60 * 1000);
      const rollingCount = await MentorshipRequestModel.countDocuments({
        studentId: student._id,
        createdAt: { $gte: rollingStart },
      });
      if (rollingCount >= maxRequestsPerRollingPeriod) {
        throw new AppError(
          `Throttled: You have reached the limit of ${maxRequestsPerRollingPeriod} requests per ${rollingPeriodDays} days.`,
          429,
          ErrorCodes.THROTTLE_LIMIT_REACHED
        );
      }

      // 3. Prevent duplicate active request between same student and mentor
      const existing = await MentorshipRequestModel.findOne({
        studentId: student._id,
        mentorId: mentor._id,
        status: { $in: ['PENDING', 'ACCEPTED'] },
      });
      if (existing) {
        throw new AppError('An active or pending mentorship already exists with this mentor.', 409, ErrorCodes.CONFLICT);
      }

      // Auto-expiry according to settings
      const expiresAt = new Date(Date.now() + requestExpiryDays * 24 * 60 * 60 * 1000);

      request = await MentorshipRequestModel.create({
        studentId: student._id,
        mentorId: mentor._id,
        careerObjective: input.careerObjective,
        requestMessage: input.requestMessage,
        preferredTopics: input.preferredTopics,
        expectedOutcomes: input.expectedOutcomes,
        preferredAvailability: input.preferredAvailability,
        status: 'PENDING',
        expiresAt,
      });
    } catch (err) {
      await StudentProfileModel.updateOne(
        { _id: student._id, pendingRequestsCount: { $gt: 0 } },
        { $inc: { pendingRequestsCount: -1 } }
      );
      throw err;
    }

    await auditService.log({
      actorId: userId,
      actorRole: 'STUDENT',
      action: 'MENTORSHIP_REQUEST_CREATED',
      entityType: 'MentorshipRequest',
      entityId: request._id.toString(),
    });

    if (mentor.userId) {
      await notificationService.sendNotification({
        userId: mentor.userId.toString(),
        type: 'REQUEST_RECEIVED',
        title: 'New Mentorship Request',
        message: 'You have received a new mentorship outreach from a student interested in your guidance.',
        metadata: { requestId: request._id.toString() },
        idempotencyKey: `notif:req_created:${request._id.toString()}`,
      });
    }

    return request;
  }

  /**
   * Mentor accepts a request with atomic capacity invariant reservation
   */
  async acceptRequest(userId: string, requestId: string) {
    const mentor = await AlumnusModel.findOne({ userId });
    if (!mentor) {
      throw new AppError('Mentor profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const request = await MentorshipRequestModel.findOne({
      _id: requestId,
      mentorId: mentor._id,
      status: 'PENDING',
    });
    if (!request) {
      throw new AppError('Pending mentorship request not found.', 404, ErrorCodes.NOT_FOUND);
    }

    await StudentProfileModel.updateOne(
      { _id: request.studentId, pendingRequestsCount: { $gt: 0 } },
      { $inc: { pendingRequestsCount: -1 } }
    );

    // Atomic conditional update on capacity: guarantees currentActiveMentees < maxActiveMentees
    const updatedCapacity = await MentorCapacityModel.findOneAndUpdate(
      {
        mentorId: mentor._id,
        $expr: { $lt: ['$currentActiveMentees', '$maxActiveMentees'] },
        isAcceptingRequests: true,
        isPaused: false,
      },
      {
        $inc: { currentActiveMentees: 1 },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    if (!updatedCapacity) {
      throw new AppError(
        'Cannot accept request: Mentor is at maximum active capacity or paused.',
        400,
        ErrorCodes.CAPACITY_EXCEEDED
      );
    }

    // Transition request to ACCEPTED
    request.status = 'ACCEPTED';
    request.respondedAt = new Date();
    await request.save();

    await StudentProfileModel.updateOne(
      { _id: request.studentId, pendingRequestsCount: { $gt: 0 } },
      { $inc: { pendingRequestsCount: -1 } }
    );

    // Create active Mentorship
    const mentorship = await MentorshipModel.create({
      studentId: request.studentId,
      mentorId: mentor._id,
      requestId: request._id,
      status: 'ACTIVE',
      healthStatus: 'HEALTHY',
      startDate: new Date(),
      lastMeaningfulActivityAt: new Date(),
    });

    await auditService.log({
      actorId: userId,
      actorRole: 'ALUMNI_MENTOR',
      action: 'MENTORSHIP_REQUEST_ACCEPTED',
      entityType: 'Mentorship',
      entityId: mentorship._id.toString(),
      metadata: { newActiveMentees: updatedCapacity.currentActiveMentees },
    });

    // Notify student of acceptance
    const studentProfile = await StudentProfileModel.findById(request.studentId);
    if (studentProfile && studentProfile.userId) {
      await notificationService.sendNotification({
        userId: studentProfile.userId.toString(),
        type: 'REQUEST_ACCEPTED',
        title: 'Mentorship Request Accepted!',
        message: 'Congratulations! Your mentor has accepted your request. Your mentorship workspace is now active.',
        metadata: { mentorshipId: mentorship._id.toString() },
        idempotencyKey: `notif:req_accepted:${mentorship._id.toString()}`,
      });
    }

    // Auto-cancel remaining pending requests if capacity is now saturated
    if (updatedCapacity.currentActiveMentees >= updatedCapacity.maxActiveMentees) {
      await autoCancelOnFullJob(mentor._id.toString());
      await MentorCapacityModel.updateOne(
        { _id: updatedCapacity._id },
        { $set: { isAcceptingRequests: false } }
      );
    }

    return { mentorship, request, capacity: updatedCapacity };
  }

  /**
   * Mentor declines request (zero rating penalty)
   */
  async declineRequest(userId: string, requestId: string, declineReason?: string) {
    const mentor = await AlumnusModel.findOne({ userId });
    if (!mentor) {
      throw new AppError('Mentor profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const request = await MentorshipRequestModel.findOneAndUpdate(
      {
        _id: requestId,
        mentorId: mentor._id,
        status: 'PENDING',
      },
      {
        status: 'DECLINED',
        declineReason,
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      throw new AppError('Pending mentorship request not found.', 404, ErrorCodes.NOT_FOUND);
    }

    await StudentProfileModel.updateOne(
      { _id: request.studentId, pendingRequestsCount: { $gt: 0 } },
      { $inc: { pendingRequestsCount: -1 } }
    );

    const studentProfile = await StudentProfileModel.findById(request.studentId);
    if (studentProfile && studentProfile.userId) {
      await notificationService.sendNotification({
        userId: studentProfile.userId.toString(),
        type: 'REQUEST_DECLINED',
        title: 'Mentorship Request Update',
        message: 'The mentor was unable to take on additional mentees at this time. You may request another mentor.',
        metadata: { requestId: request._id.toString() },
        idempotencyKey: `notif:req_declined:${request._id.toString()}`,
      });
    }

    return request;
  }

  /**
   * Student cancels a pending request
   */
  async cancelRequest(userId: string, requestId: string) {
    const student = await StudentProfileModel.findOne({ userId });
    if (!student) {
      throw new AppError('Student profile not found.', 404, ErrorCodes.NOT_FOUND);
    }

    const request = await MentorshipRequestModel.findOneAndUpdate(
      {
        _id: requestId,
        studentId: student._id,
        status: 'PENDING',
      },
      {
        status: 'CANCELLED',
      },
      { new: true }
    );

    if (!request) {
      throw new AppError('Pending request not found.', 404, ErrorCodes.NOT_FOUND);
    }

    return request;
  }

  /**
   * List sent requests for student
   */
  async getStudentRequests(userId: string) {
    const student = await StudentProfileModel.findOne({ userId });
    if (!student) return [];
    return MentorshipRequestModel.find({ studentId: student._id })
      .populate({
        path: 'mentorId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * List incoming requests for mentor
   */
  async getMentorIncomingRequests(userId: string) {
    const mentor = await AlumnusModel.findOne({ userId });
    if (!mentor) return [];
    return MentorshipRequestModel.find({ mentorId: mentor._id })
      .populate({
        path: 'studentId',
        populate: { path: 'userId' },
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Close/terminate mentorship and release 1 capacity slot
   */
  async closeMentorship(userId: string, mentorshipId: string, closureReason?: string) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
    if (!mentorship || mentorship.status !== 'ACTIVE') {
      throw new AppError('Active mentorship not found.', 404, ErrorCodes.NOT_FOUND);
    }

    mentorship.status = 'COMPLETED';
    mentorship.endDate = new Date();
    mentorship.closureReason = closureReason || 'Successfully concluded';
    await mentorship.save();

    // Release capacity exactly once
    await MentorCapacityModel.findOneAndUpdate(
      { mentorId: mentorship.mentorId, currentActiveMentees: { $gt: 0 } },
      { $inc: { currentActiveMentees: -1 }, $set: { lastUpdated: new Date() } }
    );

    return mentorship;
  }
}

export const mentorshipRequestService = new MentorshipRequestService();

