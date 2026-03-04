import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        users: {
            findUnique: vi.fn().mockResolvedValue({ id: 'user-1', xp_balance: 1000 }),
            update: vi.fn(),
        },
        xp_transactions: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'user-1', role: 'student' },
    }),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('XP API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/xp/route');
        expect(mod).toBeDefined();
    });
});
