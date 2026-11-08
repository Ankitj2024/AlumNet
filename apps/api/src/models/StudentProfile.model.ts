import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudentProfileDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  institutionalStudentId?: string;
  academicProgramme?: string;
  department?: string;
  expectedGraduationYear?: number;
  skills: string[];
  targetJobRoles: string[];
  preferredIndustries: string[];
  preferredCommunicationFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  timeZone: string;
  profileCompletionScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    institutionalStudentId: {
      type: String,
      trim: true,
      uppercase: true,
    },
    academicProgramme: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      index: true,
    },
    expectedGraduationYear: {
      type: Number,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    targetJobRoles: {
      type: [String],
      default: [],
      index: true,
    },
    preferredIndustries: {
      type: [String],
      default: [],
    },
    preferredCommunicationFrequency: {
      type: String,
      enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
      default: 'BIWEEKLY',
    },
    timeZone: {
      type: String,
      default: 'UTC',
    },
    profileCompletionScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentProfileModel = mongoose.model<IStudentProfileDocument>(
  'StudentProfile',
  StudentProfileSchema
);

