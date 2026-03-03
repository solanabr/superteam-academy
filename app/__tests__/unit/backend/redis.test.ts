import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test getRedis and getRedisOptional behavior
// The module caches the redis instance, so we need to reset between tests

describe('Redis client', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('getRedis throws when env vars are missing', async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const { getRedis } = await import('@/backend/redis');
        expect(() => getRedis()).toThrow('Redis not configured');
    });

    it('getRedisOptional returns null when env vars are missing', async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const { getRedisOptional } = await import('@/backend/redis');
        expect(getRedisOptional()).toBeNull();
    });

    it('getRedis returns a Redis instance when configured', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

        const { getRedis } = await import('@/backend/redis');
        const redis = getRedis();
        expect(redis).toBeDefined();
        expect(redis).not.toBeNull();
    });

    it('getRedis returns the same singleton instance', async () => {
        process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
        process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

        const { getRedis } = await import('@/backend/redis');
        const a = getRedis();
        const b = getRedis();
        expect(a).toBe(b);
    });
});
