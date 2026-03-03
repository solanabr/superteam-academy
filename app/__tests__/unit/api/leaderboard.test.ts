import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        users: {
            findMany: vi.fn().mockResolvedValue([
                { id: '1', username: 'user1', xp_balance: 5000 },
                { id: '2', username: 'user2', xp_balance: 3000 },
            ]),
        },
    },
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/backend/redis', () => ({
    getRedis: vi.fn(),
    getRedisOptional: vi.fn().mockReturnValue(null),
}));

describe('Leaderboard API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/leaderboard/route');
        expect(mod).toBeDefined();
        expect(mod.GET).toBeDefined();
    });
});
