import mongoose, { Document, Schema, Types } from 'mongoose';
import { ActionItemPriority } from '@p11/types';

export interface IActionItemDocument extends Document {
  _id: Types.ObjectId;
  goalId: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  description: string;
  assignedTo: Types.ObjectId;
  dueDate?: Date;
  priority: ActionItemPriority;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItemDocument>(
  {
    goalId: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      required: true,
      index: true,
    },
    mentorshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ActionItemSchema.index({ mentorshipId: 1, isCompleted: 1 });

export const ActionItemModel = mongoose.model<IActionItemDocument>(
  'ActionItem',
  ActionItemSchema
);

