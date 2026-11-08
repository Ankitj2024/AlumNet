import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFeedbackDocument extends Document {
  _id: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  submittedBy: Types.ObjectId;
  recipientRole: 'MENTOR' | 'STUDENT';
  satisfactionRating: number;
  usefulnessScore: number;
  communicationQuality: number;
  textFeedback?: string;
  isAnonymousToRecipient: boolean;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    mentorshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['MENTOR', 'STUDENT'],
      required: true,
    },
    satisfactionRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    usefulnessScore: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communicationQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    textFeedback: {
      type: String,
      trim: true,
    },
    isAnonymousToRecipient: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

FeedbackSchema.index({ mentorshipId: 1, submittedBy: 1 });

export const FeedbackModel = mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);

