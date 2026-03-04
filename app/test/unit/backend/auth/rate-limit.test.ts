import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('checkRateLimit', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('passes through when Redis is not configured in dev', async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
        process.env.NODE_ENV = 'test';

        const { checkRateLimit } = await import('@/backend/auth/rate-limit');
        const result = await checkRateLimit('test-user');
        expect(result.success).toBe(true);
        expect(result.response).toBeUndefined();
    });

    it('returns 503 in production when Redis is not configured', async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;
        // @ts-expect-error — NODE_ENV is typed as read-only but we need to override for tests
        process.env.NODE_ENV = 'production';

        const { checkRateLimit } = await import('@/backend/auth/rate-limit');
        const result = await checkRateLimit('test-user');
        expect(result.success).toBe(false);
        expect(result.response).toBeDefined();
        expect(result.response!.status).toBe(503);
    });
});
