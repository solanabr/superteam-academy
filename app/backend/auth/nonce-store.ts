/**
 * Nonce store backed by Upstash Redis.
 * Falls back to in-memory Map when Redis is not configured (dev only).
 */

import { Redis } from '@upstash/redis';

const TTL_SECONDS = 300; // 5 minutes

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

// In-memory fallback for local development
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

// Periodic cleanup of expired entries to prevent memory leak (#17)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of memoryStore) {
            if (now > entry.expiresAt) {
                memoryStore.delete(key);
            }
        }
    }, 60_000); // Every 60 seconds
}

export async function setNonce(key: string, value: string): Promise<void> {
    if (redis) {
        await redis.setex(key, TTL_SECONDS, value);
    } else {
        memoryStore.set(key, { value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
    }
}

export async function getNonce(key: string): Promise<string | null> {
    if (redis) {
        return await redis.get<string>(key);
    }

    const entry = memoryStore.get(key);
    if (!entry) return null;

    // Check expiration BEFORE deleting to avoid consuming expired nonces
    const { value, expiresAt } = entry;

    if (Date.now() > expiresAt) {
        memoryStore.delete(key);
        return null;
    }

    // Atomic consume: delete then return value
    memoryStore.delete(key);
    return value;
}

export async function deleteNonce(key: string): Promise<void> {
    if (redis) {
        await redis.del(key);
    } else {
        memoryStore.delete(key);
    }
}

