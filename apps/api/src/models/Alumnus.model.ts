import mongoose, { Document, Schema, Types } from 'mongoose';
import { VerificationStatus } from '@p11/types';

export interface IAlumnusDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  institutionalId?: string;
  graduationYear?: number;
  academicDepartment?: string;
  degree?: string;
  professionalDesignation?: string;
  organisation?: string;
  industry?: string;
  yearsOfExperience?: number;
  professionalSummary?: string;
  expertiseTags: string[];
  mentoringTopics: string[];
  preferredStudentProfiles: string[];
  preferredCareerStages: string[];
  verificationStatus: VerificationStatus;
  isSearchable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlumnusSchema = new Schema<IAlumnusDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    institutionalId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    graduationYear: {
      type: Number,
      index: true,
    },
    academicDepartment: {
      type: String,
      trim: true,
      index: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    professionalDesignation: {
      type: String,
      trim: true,
    },
    organisation: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
      index: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    professionalSummary: {
      type: String,
      trim: true,
    },
    expertiseTags: {
      type: [String],
      default: [],
      index: true,
    },
    mentoringTopics: {
      type: [String],
      default: [],
    },
    preferredStudentProfiles: {
      type: [String],
      default: [],
    },
    preferredCareerStages: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: [
        'NOT_SUBMITTED',
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'NEEDS_INFORMATION',
        'SUSPENDED',
      ],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    isSearchable: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for mentor search efficiency
AlumnusSchema.index({ verificationStatus: 1, isSearchable: 1 });

export const AlumnusModel = mongoose.model<IAlumnusDocument>('Alumnus', AlumnusSchema);

