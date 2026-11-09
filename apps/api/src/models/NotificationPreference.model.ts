import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotificationPreferenceDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  sessionReminders: boolean;
  healthNudges: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreferenceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    inAppNotifications: {
      type: Boolean,
      default: true,
    },
    sessionReminders: {
      type: Boolean,
      default: true,
    },
    healthNudges: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreferenceModel = mongoose.model<INotificationPreferenceDocument>(
  'NotificationPreference',
  NotificationPreferenceSchema
);
