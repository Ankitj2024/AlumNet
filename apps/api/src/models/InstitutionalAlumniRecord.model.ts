import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInstitutionalAlumniRecordDocument extends Document {
  _id: Types.ObjectId;
  institutionalAlumniId: string;
  legalFullName: string;
  graduationYear: number;
  academicDepartment: string;
  degreeAwarded: string;
  officialEmail?: string;
  source: 'MANUAL_IMPORT' | 'REGISTRAR_ERP_SYNC' | 'CSV_BATCH';
  isClaimed: boolean;
  claimedByUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionalAlumniRecordSchema = new Schema<IInstitutionalAlumniRecordDocument>(
  {
    institutionalAlumniId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    legalFullName: {
      type: String,
      required: true,
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: true,
      index: true,
    },
    academicDepartment: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    degreeAwarded: {
      type: String,
      required: true,
      trim: true,
    },
    officialEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['MANUAL_IMPORT', 'REGISTRAR_ERP_SYNC', 'CSV_BATCH'],
      default: 'MANUAL_IMPORT',
    },
    isClaimed: {
      type: Boolean,
      default: false,
    },
    claimedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

InstitutionalAlumniRecordSchema.index({ graduationYear: 1, academicDepartment: 1 });

export const InstitutionalAlumniRecordModel = mongoose.model<IInstitutionalAlumniRecordDocument>(
  'InstitutionalAlumniRecord',
  InstitutionalAlumniRecordSchema
);

