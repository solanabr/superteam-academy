import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        notifications: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
        },
        push_subscriptions: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'user-1' },
    }),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Notifications API', () => {
    it('subscribe module can be imported', async () => {
        const mod = await import('@/app/api/notifications/subscribe/route');
        expect(mod).toBeDefined();
    });
});
