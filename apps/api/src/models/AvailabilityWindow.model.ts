import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAvailabilityWindowDocument extends Document {
  _id: Types.ObjectId;
  mentorId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTimeUTC: string; // HH:mm
  endTimeUTC: string; // HH:mm
  mentorTimeZone: string;
  sessionDurationMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  isRecurring: boolean;
  blackoutDates: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilityWindowSchema = new Schema<IAvailabilityWindowDocument>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'Alumnus',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTimeUTC: {
      type: String,
      required: true,
      trim: true,
    },
    endTimeUTC: {
      type: String,
      required: true,
      trim: true,
    },
    mentorTimeZone: {
      type: String,
      default: 'UTC',
    },
    sessionDurationMinutes: {
      type: Number,
      default: 45,
    },
    minNoticeHours: {
      type: Number,
      default: 24,
    },
    maxAdvanceDays: {
      type: Number,
      default: 30,
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    blackoutDates: {
      type: [Date],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AvailabilityWindowSchema.index({ mentorId: 1, dayOfWeek: 1 });

export const AvailabilityWindowModel = mongoose.model<IAvailabilityWindowDocument>(
  'AvailabilityWindow',
  AvailabilityWindowSchema
);

