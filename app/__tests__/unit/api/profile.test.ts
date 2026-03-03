import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        users: {
            findUnique: vi.fn().mockResolvedValue({
                id: 'user-1',
                username: 'testuser',
                display_name: 'Test User',
            }),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Profile API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/profile/route');
        expect(mod).toBeDefined();
    });
});
