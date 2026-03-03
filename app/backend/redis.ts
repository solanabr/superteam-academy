/**
 * Shared Redis Client (Upstash).
 *
 * Singleton instance reused across the app for queue, cache,
 * event deduplication, and rate limiting.
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 */

import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
    if (_redis) return _redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        throw new Error(
            'Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.'
        );
    }

    _redis = new Redis({ url, token });
    return _redis;
}

/**
 * Non-throwing variant — returns null if Redis is unavailable.
 * Use this for graceful degradation in non-critical paths.
 */
export function getRedisOptional(): Redis | null {
    try {
        return getRedis();
    } catch {
        return null;
    }
}
