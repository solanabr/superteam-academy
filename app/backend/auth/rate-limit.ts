import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

// Tiered rate limiters for different risk profiles
const limiters = redis
    ? {
        default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), analytics: true }),
        strict: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), analytics: true }),
        lenient: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), analytics: true }),
    }
    : null;

// Warn at startup so missing Redis config is immediately visible in logs
if (!limiters && process.env.NODE_ENV === 'production') {
    console.error('[STARTUP] Rate limiting Redis not configured in production! Auth endpoints will return 503.');
}

export type RateLimitTier = 'default' | 'strict' | 'lenient';

/**
 * Check rate limit for a given identifier.
 * 
 * Tiers:
 * - `default` (5/min): general API routes, onboarding
 * - `strict` (5/hr): admin whitelist POST/DELETE
 * - `lenient` (20/min): public API reads
 * 
 * Returns { success: true } if not rate limited, or a 429 Response if blocked.
 * Passes through when Redis is not configured (dev environment).
 */
export async function checkRateLimit(
    identifier: string,
    tier: RateLimitTier = 'default'
): Promise<{ success: boolean; response?: Response }> {
    if (!limiters) {
        if (process.env.NODE_ENV === 'production') {
            console.error('Rate limiting Redis not configured in production!');
            return {
                success: false,
                response: new Response(
                    JSON.stringify({ error: 'Service temporarily unavailable' }),
                    { status: 503, headers: { 'Content-Type': 'application/json' } }
                ),
            };
        }
        return { success: true };
    }

    const limiter = limiters[tier];
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
        return {
            success: false,
            response: new Response(
                JSON.stringify({ error: 'Too many requests. Try again later.' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': String(limit),
                        'X-RateLimit-Remaining': String(remaining),
                        'X-RateLimit-Reset': String(reset),
                    },
                }
            ),
        };
    }

    return { success: true };
}
