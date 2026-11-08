import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  piiDetected: boolean;
  piiTypesDetected: string[];
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    mentorshipId: {
      type: Schema.Types.ObjectId,
      ref: 'Mentorship',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    piiDetected: {
      type: Boolean,
      default: false,
    },
    piiTypesDetected: {
      type: [String],
      default: [],
    },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

MessageSchema.index({ mentorshipId: 1, createdAt: 1 });

export const MessageModel = mongoose.model<IMessageDocument>('Message', MessageSchema);

