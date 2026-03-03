import { describe, it, expect, vi } from 'vitest';

// Mock prisma to prevent actual DB calls
vi.mock('@/backend/prisma', () => ({
    prisma: {
        audit_logs: {
            create: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        },
    },
}));

describe('logAuditEvent', () => {
    it('calls prisma.audit_logs.create with correct data', async () => {
        const { logAuditEvent } = await import('@/backend/auth/audit');
        const { prisma } = await import('@/backend/prisma');

        await logAuditEvent({
            userId: 'user-1',
            action: 'LOGIN',
            ip: '127.0.0.1',
            userAgent: 'test-agent',
            metadata: { provider: 'google' },
        });

        expect(prisma.audit_logs.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user_id: 'user-1',
                action: 'LOGIN',
                ip_address: '127.0.0.1',
                user_agent: 'test-agent',
            }),
        });
    });

    it('does not throw when prisma call fails', async () => {
        const { prisma } = await import('@/backend/prisma');
        (prisma.audit_logs.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('DB error'));

        const { logAuditEvent } = await import('@/backend/auth/audit');
        // Should not throw — audit logging failure should be silent
        await expect(logAuditEvent({
            userId: 'user-1',
            action: 'LOGIN',
        })).resolves.not.toThrow();
    });

    it('handles optional fields', async () => {
        const { logAuditEvent } = await import('@/backend/auth/audit');
        const { prisma } = await import('@/backend/prisma');

        await logAuditEvent({
            userId: 'user-2',
            action: 'LOGOUT',
        });

        expect(prisma.audit_logs.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user_id: 'user-2',
                action: 'LOGOUT',
                ip_address: null,
                user_agent: null,
            }),
        });
    });
});
