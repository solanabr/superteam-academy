import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        streaks: {
            findUnique: vi.fn().mockResolvedValue({
                current_streak: 5,
                longest_streak: 10,
                last_active_date: new Date(),
            }),
            upsert: vi.fn(),
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

describe('Streak API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/streak/route');
        expect(mod).toBeDefined();
    });
});
