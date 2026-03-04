import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/backend/prisma', () => ({
    prisma: {
        courses: {
            findMany: vi.fn().mockResolvedValue([
                { id: '1', title: 'Solana Basics', slug: 'solana-basics' },
                { id: '2', title: 'Anchor Framework', slug: 'anchor-framework' },
            ]),
            findUnique: vi.fn().mockResolvedValue({
                id: '1', title: 'Solana Basics', slug: 'solana-basics',
            }),
            count: vi.fn().mockResolvedValue(2),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Courses API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/courses/route');
        expect(mod).toBeDefined();
        // Should export at least GET
        expect(mod.GET).toBeDefined();
    });
});
