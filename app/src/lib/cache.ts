import { Redis } from "@upstash/redis";

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_URL !== "" && !process.env.UPSTASH_REDIS_REST_URL.includes("your_url_here"))
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })
    : null;

/**
 * Simple In-Memory Cache (L1) for the current server instance.
 * TTL is kept short (60s) to ensure memory safety.
 */
const l1Cache = new Map<string, { data: any; expires: number }>();
let accessCount = 0;

/**
 * Sweeps the L1 Map to remove expired entries, preventing memory leaks.
 * In serverless, this helps keep the warm lambda memory footprint low.
 */
function pruneL1() {
    const now = Date.now();
    for (const [key, entry] of l1Cache.entries()) {
        if (entry.expires < now) {
            l1Cache.delete(key);
        }
    }
}

export interface CacheOptions {
    ttl?: number; // seconds
}

export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = { ttl: 60 }
): Promise<T> {
    const now = Date.now();
    const ttlMs = (options.ttl || 60) * 1000;

    // Periodic pruning (every 100 calls)
    accessCount++;
    if (accessCount % 100 === 0) {
        pruneL1();
    }

    // 1. Check L1 Cache (Memory)
    const l1Entry = l1Cache.get(key);
    if (l1Entry && l1Entry.expires > now) {
        return l1Entry.data as T;
    }

    // 2. Check L2 Cache (Redis)
    if (redis) {
        try {
            const l2Data = await redis.get<T>(key);
            if (l2Data) {
                // Update L1
                l1Cache.set(key, { data: l2Data, expires: now + ttlMs });
                return l2Data;
            }
        } catch (e) {
            console.error(`[cache] L2/Redis error (Read): ${key}`, e);
        }
    }

    // 3. Cache Miss - Fetch fresh data
    const freshData = await fetcher();

    // 4. Update Caches
    l1Cache.set(key, { data: freshData, expires: now + ttlMs });
    if (redis) {
        const setOptions: any = {};
        if (options.ttl) {
            setOptions.ex = options.ttl;
        }
        redis.set(key, freshData, setOptions).catch(e => console.error(`[cache] L2/Redis error (Write): ${key}`, e));
    }

    return freshData;
}

export async function invalidateCache(key: string): Promise<void> {
    // Invalidate L1
    l1Cache.delete(key);

    // Invalidate L2
    if (redis) {
        await redis.del(key).catch(e => console.error("[cache] Redis delete error:", e));
    }
}

/**
 * Invalidate all keys matching a pattern (e.g., user:123:*)
 * Note: Pattern invalidation is slow in Redis if not using tags/sets,
 * but for this scale, it is fine for dev/production.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    // L1 clear (simple full clear if pattern matches)
    for (const key of l1Cache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
            l1Cache.delete(key);
        }
    }

    if (redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    }
}
