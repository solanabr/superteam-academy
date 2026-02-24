/**
 * Simple in-memory rate limiter for API routes.
 *
 * Tracks request counts per wallet address within a sliding window.
 * Default: 10 requests per 60-second window.
 *
 * NOTE: This is per-process and resets on deploy/restart. For production
 * multi-instance deployments, swap for Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(walletAddress: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = store.get(walletAddress);

  if (!entry || now > entry.resetAt) {
    store.set(walletAddress, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}
