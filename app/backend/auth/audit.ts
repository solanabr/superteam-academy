import { prisma } from '@/backend/prisma';
import type { Prisma } from '@prisma/client';

interface AuditEvent {
    userId: string;
    action: string;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
    try {
        await prisma.audit_logs.create({
            data: {
                user_id: event.userId,
                action: event.action,
                ip_address: event.ip || null,
                user_agent: event.userAgent || null,
                metadata: (event.metadata as Prisma.InputJsonValue) || undefined,
            },
        });
    } catch (error) {
        // Never let audit logging break the auth flow
        console.error('Audit log failed:', error);
    }
}
