import mongoose, { Document, Schema, Types } from 'mongoose';
import { VerificationMethod, VerificationStatus } from '@p11/types';

export interface IVerificationAuditEntry {
  action: string;
  performedBy: Types.ObjectId;
  timestamp: Date;
  comment?: string;
}

export interface IVerificationRequestDocument extends Document {
  _id: Types.ObjectId;
  alumnusId: Types.ObjectId;
  userId: Types.ObjectId;
  submittedAlumniId: string;
  graduationYear: number;
  academicDepartment: string;
  degree: string;
  documentUrls: string[];
  verificationMethod: VerificationMethod;
  institutionalRecordId?: Types.ObjectId;
  status: VerificationStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  reviewNotes?: string;
  auditHistory: IVerificationAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequestDocument>(
  {
    alumnusId: {
      type: Schema.Types.ObjectId,
      ref: 'Alumnus',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submittedAlumniId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    academicDepartment: {
      type: String,
      required: true,
      trim: true,
    },
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrls: {
      type: [String],
      default: [],
    },
    verificationMethod: {
      type: String,
      enum: ['INSTITUTIONAL_ERP_MATCH', 'CSV_REGISTRAR_MATCH', 'MANUAL_DOCUMENT_REVIEW'],
      default: 'MANUAL_DOCUMENT_REVIEW',
    },
    institutionalRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'InstitutionalAlumniRecord',
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'REJECTED',
        'NEEDS_INFORMATION',
        'SUSPENDED',
      ],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    auditHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
        comment: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const VerificationRequestModel = mongoose.model<IVerificationRequestDocument>(
  'VerificationRequest',
  VerificationRequestSchema
);

