import { Types } from 'mongoose';
import { AppError, ErrorCodes } from '@p11/shared';
import {
  ProgrammeSettingsModel,
  IProgrammeSettingsDocument,
} from '../models/ProgrammeSettings.model.js';
import { UserModel } from '../models/User.model.js';
import { auditService } from './audit.service.js';

export interface UpdateProgrammeSettingsInput {
  matchingWeights?: {
    expertiseWeight: number;
    roleWeight: number;
    industryWeight: number;
    mentoringInterestWeight: number;
    availabilityWeight: number;
  };
  requestLimits?: {
    maxPendingRequestsPerStudent: number;
    maxRequestsPerRollingPeriod: number;
    rollingPeriodDays: number;
    requestExpiryDays: number;
  };
  capacityBounds?: {
    minMentorCapacity: number;
    maxMentorCapacity: number;
  };
  engagementThresholds?: {
    atRiskDays: number;
    dormantDays: number;
    dormantGraceDays: number;
  };
  reason?: string;
}

export class ProgrammeSettingsService {
  private cachedSettings: IProgrammeSettingsDocument | null = null;
  private cacheExpiresAt: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1-minute TTL fallback

  /**
   * Cached accessor for active programme policy settings
   */
  async getSettings(): Promise<IProgrammeSettingsDocument> {
    const now = Date.now();
    if (this.cachedSettings && now < this.cacheExpiresAt) {
      return this.cachedSettings;
    }

    let settings = await ProgrammeSettingsModel.findOne().sort({ createdAt: -1 });
    if (!settings) {
      // Seed default baseline settings
      settings = await ProgrammeSettingsModel.create({
        matchingWeights: {
          expertiseWeight: 0.4,
          roleWeight: 0.2,
          industryWeight: 0.15,
          mentoringInterestWeight: 0.1,
          availabilityWeight: 0.15,
        },
        requestLimits: {
          maxPendingRequestsPerStudent: 3,
          maxRequestsPerRollingPeriod: 5,
          rollingPeriodDays: 7,
          requestExpiryDays: 7,
        },
        capacityBounds: {
          minMentorCapacity: 1,
          maxMentorCapacity: 10,
        },
        engagementThresholds: {
          atRiskDays: 14,
          dormantDays: 28,
          dormantGraceDays: 7,
        },
        changeHistory: [],
        version: 1,
      });
    }

    this.cachedSettings = settings;
    this.cacheExpiresAt = now + this.CACHE_TTL_MS;
    return settings;
  }

  /**
   * Invalidate cache on settings mutation
   */
  invalidateCache(): void {
    this.cachedSettings = null;
    this.cacheExpiresAt = 0;
  }

  /**
   * Update programme settings (Super Admin only, audited, with history)
   */
  async updateSettings(
    adminUserId: string,
    input: UpdateProgrammeSettingsInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IProgrammeSettingsDocument> {
    const admin = await UserModel.findById(adminUserId);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      throw new AppError(
        'Access denied: Only Super Administrators can alter programme policy settings.',
        403,
        ErrorCodes.FORBIDDEN
      );
    }

    const current = await this.getSettings();

    // 1. Validate Matching Weights Sum = 1.0
    if (input.matchingWeights) {
      const {
        expertiseWeight,
        roleWeight,
        industryWeight,
        mentoringInterestWeight,
        availabilityWeight,
      } = input.matchingWeights;

      const sum =
        expertiseWeight +
        roleWeight +
        industryWeight +
        mentoringInterestWeight +
        availabilityWeight;

      // Allow 0.001 floating point precision margin
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new AppError(
          `Matching weights must sum exactly to 1.0 (received sum: ${sum.toFixed(3)}).`,
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }

      if (
        expertiseWeight < 0 ||
        roleWeight < 0 ||
        industryWeight < 0 ||
        mentoringInterestWeight < 0 ||
        availabilityWeight < 0
      ) {
        throw new AppError(
          'All matching weights must be non-negative values.',
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // 2. Validate Request Limits
    if (input.requestLimits) {
      const {
        maxPendingRequestsPerStudent,
        maxRequestsPerRollingPeriod,
        rollingPeriodDays,
        requestExpiryDays,
      } = input.requestLimits;

      if (
        maxPendingRequestsPerStudent < 1 ||
        maxRequestsPerRollingPeriod < 1 ||
        rollingPeriodDays < 1 ||
        requestExpiryDays < 1
      ) {
        throw new AppError(
          'Request limit parameters must be positive integers.',
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // 3. Validate Capacity Bounds (1 to 10)
    if (input.capacityBounds) {
      const { minMentorCapacity, maxMentorCapacity } = input.capacityBounds;
      if (minMentorCapacity < 1 || maxMentorCapacity > 10 || minMentorCapacity > maxMentorCapacity) {
        throw new AppError(
          'Mentor max-capacity bounds must be between 1 and 10, with min <= max.',
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // 4. Validate Engagement Thresholds
    if (input.engagementThresholds) {
      const { atRiskDays, dormantDays, dormantGraceDays } = input.engagementThresholds;
      if (atRiskDays < 1 || dormantDays <= atRiskDays || dormantGraceDays < 1) {
        throw new AppError(
          'Invalid engagement thresholds: atRiskDays must be less than dormantDays, and grace period must be positive.',
          400,
          ErrorCodes.VALIDATION_ERROR
        );
      }
    }

    // Store previous settings snapshot for change history
    const previousSnapshot = {
      matchingWeights: { ...current.matchingWeights },
      requestLimits: { ...current.requestLimits },
      capacityBounds: { ...current.capacityBounds },
      engagementThresholds: { ...current.engagementThresholds },
      version: current.version,
    };

    const newSnapshot = {
      matchingWeights: input.matchingWeights ?? current.matchingWeights,
      requestLimits: input.requestLimits ?? current.requestLimits,
      capacityBounds: input.capacityBounds ?? current.capacityBounds,
      engagementThresholds: input.engagementThresholds ?? current.engagementThresholds,
    };

    // Append to change history
    const changeEntry = {
      modifiedBy: new Types.ObjectId(adminUserId),
      modifiedByName: `${admin.firstName} ${admin.lastName}`,
      modifiedAt: new Date(),
      previousSettings: previousSnapshot,
      newSettings: newSnapshot,
      reason: input.reason || 'Programme policy adjustment by Super Administrator',
    };

    current.matchingWeights = newSnapshot.matchingWeights;
    current.requestLimits = newSnapshot.requestLimits;
    current.capacityBounds = newSnapshot.capacityBounds;
    current.engagementThresholds = newSnapshot.engagementThresholds;
    current.changeHistory.unshift(changeEntry as any);
    current.updatedBy = new Types.ObjectId(adminUserId);
    current.version = (current.version || 1) + 1;

    await current.save();

    // Invalidate cache immediately
    this.invalidateCache();

    // Log to system audit trail
    await auditService.log({
      actorId: adminUserId,
      actorRole: admin.role,
      action: 'PROGRAMME_SETTINGS_UPDATED',
      entityType: 'ProgrammeSettings',
      entityId: current._id.toString(),
      ipAddress,
      userAgent,
      metadata: {
        version: current.version,
        reason: input.reason,
        changes: newSnapshot,
      },
    });

    return current;
  }

  /**
   * Retrieve settings change history
   */
  async getChangeHistory(): Promise<any[]> {
    const settings = await this.getSettings();
    return settings.changeHistory || [];
  }
}

export const programmeSettingsService = new ProgrammeSettingsService();
