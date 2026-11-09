import mongoose, { Document, Schema, Types } from 'mongoose';
import { MentorshipRequestStatus } from '@p11/types';

export interface IMentorshipRequestDocument extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  mentorId: Types.ObjectId;
  careerObjective: string;
  requestMessage: string;
  preferredTopics: string[];
  expectedOutcomes: string;
  preferredAvailability: string;
  status: MentorshipRequestStatus;
  idempotencyKey?: string;
  declineReason?: string;
  respondedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequestDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: true,
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Alumnus',
      required: true,
      index: true,
    },
    careerObjective: {
      type: String,
      required: true,
      trim: true,
    },
    requestMessage: {
      type: String,
      required: true,
      trim: true,
    },
    preferredTopics: {
      type: [String],
      default: [],
    },
    expectedOutcomes: {
      type: String,
      trim: true,
    },
    preferredAvailability: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'AUTO_CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
    declineReason: {
      type: String,
      trim: true,
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipRequestSchema.index({ studentId: 1, status: 1 });
MentorshipRequestSchema.index({ mentorId: 1, status: 1 });

export const MentorshipRequestModel = mongoose.model<IMentorshipRequestDocument>(
  'MentorshipRequest',
  MentorshipRequestSchema
);

