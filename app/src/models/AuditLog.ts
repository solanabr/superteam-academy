import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  description: string;
  resource: string;
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: String,
    userEmail: String,
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        'User Login',
        'User Logout',
        'User Created',
        'User Updated',
        'User Deleted',
        'User Role Changed',
        'User Enabled',
        'User Disabled',
        'Course Created',
        'Course Updated',
        'Course Deleted',
        'Course Published',
        'Settings Updated',
        'Alert Created',
        'Alert Resolved',
        'Indexer Config Updated',
        'Track Created',
        'Track Updated',
        'Track Deleted',
        'Challenge Created',
        'Challenge Updated',
        'Challenge Deleted',
        'Announcement Created',
        'Announcement Updated',
        'Announcement Deleted',
        'Notification Sent',
        'Notification Updated',
        'Notification Send Failed',
        'Notification Status Updated',
        'Notification Deleted',
        'Other',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ['user', 'course', 'track', 'settings', 'alert', 'indexer', 'auth', 'other'],
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    resourceName: String,
    changes: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      required: true,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    errorMessage: String,
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
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
