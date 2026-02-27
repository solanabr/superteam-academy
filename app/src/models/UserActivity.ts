import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  username?: string;
  email?: string;
  activityType:
    | 'login'
    | 'logout'
    | 'course_view'
    | 'course_enrollment'
    | 'lesson_complete'
    | 'challenge_solve'
    | 'post_create'
    | 'comment_create'
    | 'like'
    | 'profile_update'
    | 'settings_update'
    | 'other';
  description: string;
  resource: 'user' | 'course' | 'lesson' | 'challenge' | 'community' | 'profile' | 'other';
  resourceId: string;
  resourceName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  duration?: number; // in seconds, for sessions
  timestamp: Date;
  createdAt: Date;
}

const userActivitySchema = new Schema<IUserActivity>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: String,
    email: String,
    activityType: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'course_view',
        'course_enrollment',
        'lesson_complete',
        'challenge_solve',
        'post_create',
        'comment_create',
        'like',
        'profile_update',
        'settings_update',
        'other',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      enum: ['user', 'course', 'lesson', 'challenge', 'community', 'profile', 'other'],
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    resourceName: String,
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    sessionId: {
      type: String,
      index: true,
    },
    duration: Number,
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });
userActivitySchema.index({ resource: 1, timestamp: -1 });
userActivitySchema.index({ timestamp: -1 });
userActivitySchema.index({ email: 1, timestamp: -1 });

export const UserActivity =
  mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', userActivitySchema);
