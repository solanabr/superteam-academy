/**
 * Failed login attempt tracker.
 *
 * Uses Redis (production) or in-memory Map (development) to track
 * failed authentication attempts per identifier (wallet address, IP, etc.).
 *
 * After MAX_FAILED_ATTEMPTS within the LOCKOUT_WINDOW, the identifier
 * is locked out for LOCKOUT_DURATION.
 */

import { Redis } from '@upstash/redis';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 300; // 5 minutes
const LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

// In-memory fallback for local development
const memoryStore = new Map<string, { count: number; lockedUntil: number; firstAttempt: number }>();

/**
 * Check if an identifier is currently locked out.
 * Returns true if locked out (should deny access).
 */
export async function isLockedOut(identifier: string): Promise<boolean> {
    const key = `lockout:${identifier}`;

    if (redis) {
        const locked = await redis.get<string>(key);
        return locked === 'locked';
    }

    const entry = memoryStore.get(key);
    if (!entry) return false;

    if (Date.now() > entry.lockedUntil && entry.lockedUntil > 0) {
        memoryStore.delete(key);
        return false;
    }

    return entry.lockedUntil > 0 && Date.now() < entry.lockedUntil;
}

/**
 * Record a failed authentication attempt.
 * If MAX_FAILED_ATTEMPTS is exceeded within the window, locks out the identifier.
 * Returns true if the identifier is now locked out.
 */
export async function recordFailedAttempt(identifier: string): Promise<boolean> {
    const key = `lockout:${identifier}`;
    const attemptsKey = `attempts:${identifier}`;

    if (redis) {
        const count = await redis.incr(attemptsKey);
        if (count === 1) {
            // First attempt — set TTL for the window
            await redis.expire(attemptsKey, LOCKOUT_WINDOW_SECONDS);
        }

        if (count >= MAX_FAILED_ATTEMPTS) {
            // Lock out the identifier
            await redis.setex(key, LOCKOUT_DURATION_SECONDS, 'locked');
            await redis.del(attemptsKey);
            console.warn(`[Security] Account locked: ${identifier} after ${count} failed attempts`);
            return true;
        }

        return false;
    }

    // In-memory fallback
    const now = Date.now();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.firstAttempt + LOCKOUT_WINDOW_SECONDS * 1000) {
        // Start fresh window
        memoryStore.set(key, { count: 1, lockedUntil: 0, firstAttempt: now });
        return false;
    }

    entry.count++;

    if (entry.count >= MAX_FAILED_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_DURATION_SECONDS * 1000;
        console.warn(`[Security] Account locked: ${identifier} after ${entry.count} failed attempts`);
        return true;
    }

    return false;
}

/**
 * Clear failed attempts after a successful authentication.
 */
export async function clearFailedAttempts(identifier: string): Promise<void> {
    const key = `lockout:${identifier}`;
    const attemptsKey = `attempts:${identifier}`;

    if (redis) {
        await redis.del(key, attemptsKey);
    } else {
        memoryStore.delete(key);
    }
}
