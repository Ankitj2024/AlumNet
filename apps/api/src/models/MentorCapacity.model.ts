import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMentorCapacityDocument extends Document {
  _id: Types.ObjectId;
  mentorId: Types.ObjectId;
  maxActiveMentees: number;
  currentActiveMentees: number;
  isAcceptingRequests: boolean;
  isPaused: boolean;
  pausedUntil?: Date;
  pauseReason?: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorCapacitySchema = new Schema<IMentorCapacityDocument>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Alumnus',
      required: true,
      unique: true,
      index: true,
    },
    maxActiveMentees: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 2,
    },
    currentActiveMentees: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isAcceptingRequests: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
      index: true,
    },
    pausedUntil: {
      type: Date,
      index: true,
    },
    pauseReason: {
      type: String,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const MentorCapacityModel = mongoose.model<IMentorCapacityDocument>(
  'MentorCapacity',
  MentorCapacitySchema
);

