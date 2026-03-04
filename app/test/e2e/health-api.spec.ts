import { test, expect } from '@playwright/test';

test.describe('Health API', () => {
    test('GET /api/health returns 200 or 503', async ({ request }) => {
        const response = await request.get('/api/health');
        // Accept 200 (healthy) or 503 (degraded)
        expect([200, 503]).toContain(response.status());
    });

    test('returns valid JSON with expected shape', async ({ request }) => {
        const response = await request.get('/api/health');
        const json = await response.json();
        expect(json).toHaveProperty('status');
        expect(json).toHaveProperty('timestamp');
        expect(json).toHaveProperty('checks');
        expect(['healthy', 'degraded']).toContain(json.status);
    });

    test('includes database check', async ({ request }) => {
        const response = await request.get('/api/health');
        const json = await response.json();
        expect(json.checks).toHaveProperty('database');
        expect(json.checks.database).toHaveProperty('ok');
    });

    test('includes Solana RPC check', async ({ request }) => {
        const response = await request.get('/api/health');
        const json = await response.json();
        expect(json.checks).toHaveProperty('solana_rpc');
        expect(json.checks.solana_rpc).toHaveProperty('ok');
    });
});
