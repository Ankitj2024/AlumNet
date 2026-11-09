import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgrammeSettingsChangeEntry {
  modifiedBy: Types.ObjectId;
  modifiedByName?: string;
  modifiedAt: Date;
  previousSettings: any;
  newSettings: any;
  reason?: string;
}

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
  capacityBounds: {
    minMentorCapacity: number;
    maxMentorCapacity: number;
  };
  engagementThresholds: {
    atRiskDays: number;
    dormantDays: number;
    dormantGraceDays: number;
  };
  changeHistory: IProgrammeSettingsChangeEntry[];
  updatedBy?: Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProgrammeSettingsSchema = new Schema<IProgrammeSettingsDocument>(
  {
    matchingWeights: {
      expertiseWeight: { type: Number, default: 0.4 },
      roleWeight: { type: Number, default: 0.2 },
      industryWeight: { type: Number, default: 0.15 },
      mentoringInterestWeight: { type: Number, default: 0.1 },
      availabilityWeight: { type: Number, default: 0.15 },
    },
    requestLimits: {
      maxPendingRequestsPerStudent: { type: Number, default: 3 },
      maxRequestsPerRollingPeriod: { type: Number, default: 5 },
      rollingPeriodDays: { type: Number, default: 7 },
      requestExpiryDays: { type: Number, default: 7 },
    },
    capacityBounds: {
      minMentorCapacity: { type: Number, default: 1 },
      maxMentorCapacity: { type: Number, default: 10 },
    },
    engagementThresholds: {
      atRiskDays: { type: Number, default: 14 },
      dormantDays: { type: Number, default: 28 },
      dormantGraceDays: { type: Number, default: 7 },
    },
    changeHistory: [
      {
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        modifiedByName: { type: String },
        modifiedAt: { type: Date, default: Date.now },
        previousSettings: { type: Schema.Types.Mixed },
        newSettings: { type: Schema.Types.Mixed },
        reason: { type: String },
      },
    ],
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
