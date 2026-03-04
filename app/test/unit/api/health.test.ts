import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('@/backend/prisma', () => ({
    prisma: {
        $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    },
}));

vi.mock('@solana/web3.js', () => ({
    Connection: vi.fn().mockImplementation(() => ({
        getSlot: vi.fn().mockResolvedValue(12345),
    })),
}));

// Mock global fetch for Supabase/Redis health checks
const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
});
vi.stubGlobal('fetch', mockFetch);

describe('GET /api/health', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
        });
    });

    it('returns a JSON response', async () => {
        const { GET } = await import('@/app/api/health/route');
        const response = await GET();
        expect(response).toBeDefined();
        const json = await response.json();
        expect(json).toHaveProperty('status');
        expect(json).toHaveProperty('timestamp');
        expect(json).toHaveProperty('checks');
    });

    it('includes all service checks', async () => {
        const { GET } = await import('@/app/api/health/route');
        const response = await GET();
        const json = await response.json();
        expect(json.checks).toHaveProperty('database');
        expect(json.checks).toHaveProperty('solana_rpc');
        expect(json.checks).toHaveProperty('supabase');
    });

    it('returns a valid status value (healthy or degraded)', async () => {
        const { GET } = await import('@/app/api/health/route');
        const response = await GET();
        const json = await response.json();
        expect(['healthy', 'degraded']).toContain(json.status);
        expect([200, 503]).toContain(response.status);
    });

    it('returns valid ISO timestamp', async () => {
        const { GET } = await import('@/app/api/health/route');
        const response = await GET();
        const json = await response.json();
        expect(new Date(json.timestamp).toISOString()).toBe(json.timestamp);
    });

    it('database check has ok and latencyMs fields', async () => {
        const { GET } = await import('@/app/api/health/route');
        const response = await GET();
        const json = await response.json();
        expect(json.checks.database).toHaveProperty('ok');
        expect(json.checks.database).toHaveProperty('latencyMs');
        expect(typeof json.checks.database.latencyMs).toBe('number');
    });
});
