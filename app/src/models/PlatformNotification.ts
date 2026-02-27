import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlatformNotification extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  description?: string;
  type: 'announcement' | 'alert' | 'update' | 'achievement' | 'maintenance' | 'community';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentBy: mongoose.Types.ObjectId; // Admin user ID
  sentByName: string;
  sentByEmail: string;
  targetUsers?: mongoose.Types.ObjectId[]; // If empty, sent to all users
  targetRoles?: ('user' | 'instructor' | 'moderator' | 'admin' | 'super_admin')[]; // If specified, only these roles
  targetLanguages?: ('en' | 'pt-br' | 'es')[]; // If specified, only these languages
  recipientCount: number;
  readCount: number;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  link?: string; // Optional CTA link
  linkText?: string; // CTA button text
  imageUrl?: string; // Optional notification image
  icon?: string; // Icon identifier
  isDismissible: boolean; // Can users dismiss?
  expiresAt?: Date; // Auto-remove after this date
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
}

const PlatformNotificationSchema = new Schema<IPlatformNotification>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['announcement', 'alert', 'update', 'achievement', 'maintenance', 'community'],
      default: 'announcement',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sentByName: {
      type: String,
      required: true,
    },
    sentByEmail: {
      type: String,
      required: true,
    },
    targetUsers: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      sparse: true,
    },
    targetRoles: {
      type: [String],
      enum: ['user', 'instructor', 'moderator', 'admin', 'super_admin'],
      sparse: true,
    },
    targetLanguages: {
      type: [String],
      enum: ['en', 'pt-br', 'es'],
      sparse: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
      index: true,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    readBy: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    link: {
      type: String,
      sparse: true,
    },
    linkText: {
      type: String,
      maxlength: 50,
    },
    imageUrl: {
      type: String,
      sparse: true,
    },
    icon: {
      type: String,
      sparse: true,
    },
    isDismissible: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      sparse: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'archived'],
      default: 'draft',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on sentAt for efficient queries
PlatformNotificationSchema.index({ sentAt: -1 });
PlatformNotificationSchema.index({ status: 1, sentAt: -1 });
PlatformNotificationSchema.index({ type: 1, sentAt: -1 });

export const PlatformNotification: Model<IPlatformNotification> =
  mongoose.models.PlatformNotification ||
  mongoose.model<IPlatformNotification>('PlatformNotification', PlatformNotificationSchema);
