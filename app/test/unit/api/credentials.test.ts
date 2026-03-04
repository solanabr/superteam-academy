import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        credentials: {
            findMany: vi.fn().mockResolvedValue([]),
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

describe('Credentials API', () => {
    it('issue module can be imported', async () => {
        const mod = await import('@/app/api/credentials/issue/route');
        expect(mod).toBeDefined();
    });
});
