import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/mongodb';

export interface LogAuditEventParams {
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
  status?: 'success' | 'failure';
  errorMessage?: string;
}

/**
 * Log an audit event to the database
 * This should be called whenever an admin performs an action
 */
export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    await connectToDatabase();

    const auditLog = new AuditLog({
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      action: params.action,
      description: params.description,
      resource: params.resource,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      changes: params.changes,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      status: params.status || 'success',
      errorMessage: params.errorMessage,
      timestamp: new Date(),
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw - audit logging failures shouldn't break the application
    return null;
  }
}

/**
 * Get the user's IP address from the request
 */
export function getClientIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  return ip === 'unknown' ? undefined : ip;
}

/**
 * Get the user agent from the request
 */
export function getClientUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
