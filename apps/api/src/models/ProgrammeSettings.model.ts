import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgrammeSettingsDocument extends Document {
  _id: Types.ObjectId;
  matchingWeights: {
    expertiseWeight: number;
    roleWeight: number;
    industryWeight: number;
    mentoringInterestWeight: number;
    availabilityWeight: number;
  };
  requestLimits: {
    maxPendingRequestsPerStudent: number;
    maxRequestsPerRollingPeriod: number;
    rollingPeriodDays: number;
    requestExpiryDays: number;
  };
  engagementThresholds: {
    atRiskDays: number;
    dormantDays: number;
  };
  updatedBy?: Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgrammeSettingsSchema = new Schema<IProgrammeSettingsDocument>(
  {
    matchingWeights: {
      expertiseWeight: { type: Number, default: 40 },
      roleWeight: { type: Number, default: 20 },
      industryWeight: { type: Number, default: 15 },
      mentoringInterestWeight: { type: Number, default: 10 },
      availabilityWeight: { type: Number, default: 15 },
    },
    requestLimits: {
      maxPendingRequestsPerStudent: { type: Number, default: 3 },
      maxRequestsPerRollingPeriod: { type: Number, default: 5 },
      rollingPeriodDays: { type: Number, default: 7 },
      requestExpiryDays: { type: Number, default: 7 },
    },
    engagementThresholds: {
      atRiskDays: { type: Number, default: 14 },
      dormantDays: { type: Number, default: 28 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const ProgrammeSettingsModel = mongoose.model<IProgrammeSettingsDocument>(
  'ProgrammeSettings',
  ProgrammeSettingsSchema
);

