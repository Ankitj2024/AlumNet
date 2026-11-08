import mongoose, { Document, Schema, Types } from 'mongoose';
import { MentorshipStatus, MentorshipHealthStatus } from '@p11/types';

export interface IMentorshipDocument extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  mentorId: Types.ObjectId;
  requestId: Types.ObjectId;
  status: MentorshipStatus;
  healthStatus: MentorshipHealthStatus;
  startDate: Date;
  endDate?: Date;
  lastMeaningfulActivityAt: Date;
  totalSessionsCompleted: number;
  closureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipSchema = new Schema<IMentorshipDocument>(
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
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRequest',
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'TERMINATED'],
      default: 'ACTIVE',
      index: true,
    },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'AT_RISK', 'DORMANT'],
      default: 'HEALTHY',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    lastMeaningfulActivityAt: {
      type: Date,
      default: Date.now,
    },
    totalSessionsCompleted: {
      type: Number,
      default: 0,
    },
    closureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipSchema.index({ studentId: 1, status: 1 });
MentorshipSchema.index({ mentorId: 1, status: 1 });

export const MentorshipModel = mongoose.model<IMentorshipDocument>(
  'Mentorship',
  MentorshipSchema
);

