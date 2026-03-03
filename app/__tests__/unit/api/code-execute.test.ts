import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn().mockResolvedValue({
        user: { id: 'user-1', role: 'student' },
    }),
}));

vi.mock('@/backend/auth/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock global fetch for Judge0 API
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ token: 'mock-token', status: { id: 3 }, stdout: 'Hello' }),
}));

describe('Code Execute API', () => {
    it('module can be imported', async () => {
        const mod = await import('@/app/api/code/execute/route');
        expect(mod).toBeDefined();
        expect(mod.POST).toBeDefined();
    });
});
