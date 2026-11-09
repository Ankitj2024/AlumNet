import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPlacementRecordDocument extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  company: string;
  role: string;
  package: number; // e.g. CTC in INR or annual USD
  currency: string; // 'INR', 'USD', etc.
  mentorshipAttributed: boolean;
  placedAt: Date;
  reportedBy: Types.ObjectId;
  source: 'STUDENT_SELF_REPORT' | 'REGISTRAR_IMPORT';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlacementRecordSchema = new Schema<IPlacementRecordDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    package: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    mentorshipAttributed: {
      type: Boolean,
      default: false,
      index: true,
    },
    placedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['STUDENT_SELF_REPORT', 'REGISTRAR_IMPORT'],
      default: 'STUDENT_SELF_REPORT',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

PlacementRecordSchema.index({ mentorshipAttributed: 1, placedAt: -1 });

export const PlacementRecordModel = mongoose.model<IPlacementRecordDocument>(
  'PlacementRecord',
  PlacementRecordSchema
);
