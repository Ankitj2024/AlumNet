import mongoose, { Document, Schema, Types } from 'mongoose';
import { SessionStatus } from '@p11/types';

export interface ISessionDocument extends Document {
  _id: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  timeZone: string;
  status: SessionStatus;
  proposedBy: Types.ObjectId;
  meetingLink?: string;
  agenda?: string;
  mentorNotes?: string;
  sharedNotes?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISessionDocument>(
  {
    mentorshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'],
      default: 'PROPOSED',
      index: true,
    },
    proposedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    agenda: {
      type: String,
      trim: true,
    },
    mentorNotes: {
      type: String,
      trim: true,
    },
    sharedNotes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ mentorshipId: 1, scheduledStartTime: 1 });

export const SessionModel = mongoose.model<ISessionDocument>('Session', SessionSchema);

