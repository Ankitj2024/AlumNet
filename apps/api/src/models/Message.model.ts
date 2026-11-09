import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  mentorshipId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string; // Redacted content stored for receiver
  encryptedContent: string; // AES-256-GCM encrypted original content
  iv: string;
  authTag: string;
  isRedacted: boolean;
  detectedTypes: string[];
  piiDetected?: boolean;
  piiTypesDetected?: string[];
  senderWarning?: string;
  isMutualContactUnlocked?: boolean;
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
    encryptedContent: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    isRedacted: {
      type: Boolean,
      default: false,
      index: true,
    },
    detectedTypes: {
      type: [String],
      default: [],
    },
    senderWarning: {
      type: String,
    },
    isMutualContactUnlocked: {
      type: Boolean,
      default: false,
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
MessageSchema.index({ senderId: 1, isRedacted: 1, createdAt: -1 });

export const MessageModel = mongoose.model<IMessageDocument>('Message', MessageSchema);
