import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        achievements: {
            findMany: vi.fn().mockResolvedValue([]),
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

describe('Achievements API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/achievements/route');
        expect(mod).toBeDefined();
        expect(mod.GET).toBeDefined();
    });
});
