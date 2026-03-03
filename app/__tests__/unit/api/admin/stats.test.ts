import { describe, it, expect, vi } from 'vitest';

vi.mock('@/backend/prisma', () => ({
    prisma: {
        users: {
            count: vi.fn().mockResolvedValue(100),
            findMany: vi.fn().mockResolvedValue([]),
        },
        courses: {
            count: vi.fn().mockResolvedValue(10),
        },
        enrollments: {
            count: vi.fn().mockResolvedValue(50),
        },
    },
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
    }),
}));

vi.mock('@/backend/admin/csrf', () => ({
    verifyOrigin: vi.fn().mockReturnValue(null),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Admin Stats API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/admin/stats/route');
        expect(mod).toBeDefined();
        expect(mod.GET).toBeDefined();
    });
});

describe('Admin Users API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/admin/users/route');
        expect(mod).toBeDefined();
    });
});
