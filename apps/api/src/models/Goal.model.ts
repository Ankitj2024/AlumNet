import mongoose, { Document, Schema, Types } from 'mongoose';
import { GoalCategory, GoalStatus } from '@p11/types';

export interface IGoalDocument extends Document {
  _id: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  title: string;
  description?: string;
  category: GoalCategory;
  targetDate: Date;
  progressPercentage: number;
  status: GoalStatus;
  createdBy: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoalDocument>(
  {
    mentorshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'TECHNICAL_SKILLS',
        'CAREER_STRATEGY',
        'INTERVIEW_PREP',
        'NETWORKING',
        'PORTFOLIO_REVIEW',
      ],
      default: 'CAREER_STRATEGY',
    },
    targetDate: {
      type: Date,
      required: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

GoalSchema.index({ mentorshipId: 1, status: 1 });

export const GoalModel = mongoose.model<IGoalDocument>('Goal', GoalSchema);

