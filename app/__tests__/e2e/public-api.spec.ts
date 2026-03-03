import { test, expect } from '@playwright/test';

test.describe('Public API Endpoints', () => {
    test('GET /api/leaderboard returns JSON', async ({ request }) => {
        const response = await request.get('/api/leaderboard');
        // Should return 200 or a valid error
        expect(response.status()).toBeLessThan(500);
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
    });

    test('GET /api/courses returns JSON', async ({ request }) => {
        const response = await request.get('/api/courses');
        expect(response.status()).toBeLessThan(500);
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
    });

    test('GET /api/achievements returns JSON', async ({ request }) => {
        const response = await request.get('/api/achievements');
        expect(response.status()).toBeLessThan(500);
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/json');
    });

    test('non-existent API route returns 404', async ({ request }) => {
        const response = await request.get('/api/nonexistent-route-12345');
        expect(response.status()).toBe(404);
    });
});
