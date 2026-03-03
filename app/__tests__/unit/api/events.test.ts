import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        events: {
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
        },
    },
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Events API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/events/route');
        expect(mod).toBeDefined();
    });
});
