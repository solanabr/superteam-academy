/**
 * Audit Log Service
 * Handles logging of admin actions and system events
 */
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

export interface LogActionParams {
  userId: string;
  action: string;
  description: string;
  resource: string;
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, any>;
  status?: 'success' | 'failure';
  errorMessage?: string;
  userName?: string;
  userEmail?: string;
}

/**
 * Log an action to the audit trail
 */
export async function logAction(
  params: LogActionParams
): Promise<InstanceType<typeof AuditLog> | null> {
  try {
    await connectToDatabase();

    const allowedActions =
      ((AuditLog.schema.path('action') as mongoose.SchemaType & { enumValues?: string[] })
        ?.enumValues as string[] | undefined) || [];

    const normalizedAction =
      params.action && (allowedActions.length === 0 || allowedActions.includes(params.action))
        ? params.action
        : 'Other';

    const log = new AuditLog({
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      action: normalizedAction,
      description: params.description,
      resource: params.resource,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      changes: params.changes,
      status: params.status || 'success',
      errorMessage: params.errorMessage,
      timestamp: new Date(),
    });

    return await log.save();
  } catch (error) {
    console.error('Error logging action:', error);
    return null;
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  },
  pagination?: {
    limit?: number;
    skip?: number;
  }
): Promise<{ logs: InstanceType<typeof AuditLog>[]; total: number }> {
  try {
    await connectToDatabase();

    let query: any = {};

    if (filters?.userId) query.userId = filters.userId;
    if (filters?.action) query.action = filters.action;
    if (filters?.resource) query.resource = filters.resource;
    if (filters?.status) query.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const limit = pagination?.limit || 50;
    const skip = pagination?.skip || 0;

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(limit).skip(skip).exec();

    const total = await AuditLog.countDocuments(query);

    return { logs, total };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], total: 0 };
  }
}
