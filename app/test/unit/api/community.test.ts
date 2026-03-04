import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        community_threads: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue({ id: 'thread-1' }),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Community Threads API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/community/threads/route');
        expect(mod).toBeDefined();
        expect(mod.GET || mod.POST).toBeDefined();
    });
});
