import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        lesson_completions: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        enrollments: {
            findUnique: vi.fn(),
            update: vi.fn(),
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

describe('Lessons API', () => {
    it('complete module can be imported', async () => {
        const mod = await import('@/app/api/lessons/complete/route');
        expect(mod).toBeDefined();
    });
});
