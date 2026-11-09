import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole, UserStatus } from '@p11/types';

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  mfaSecret?: string;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  deletedAt?: Date;
  purgeScheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'STUDENT',
        'ALUMNI_MENTOR',
        'ALUMNI_RELATIONS_OFFICER',
        'PLACEMENT_OFFICER',
        'SUPER_ADMIN',
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'DELETED', 'PENDING_EMAIL_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },
    purgeScheduledAt: {
      type: Date,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockoutUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

