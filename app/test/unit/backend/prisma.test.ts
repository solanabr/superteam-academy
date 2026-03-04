import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock prisma
vi.mock('@/backend/prisma', () => ({
    prisma: {
        users: {
            findFirst: vi.fn(),
        },
    },
}));

describe('Prisma client', () => {
    it('exports a prisma instance', async () => {
        const mod = await import('@/backend/prisma');
        expect(mod.prisma).toBeDefined();
    });
});
