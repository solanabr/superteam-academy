/**
 * In-memory rate limiter.
 *
 * WARNING: This store resets on every serverless cold start, so it provides
 * per-isolate protection only — not distributed rate limiting across
 * concurrent instances. For production distributed rate limiting, replace
 * this with Upstash Redis (https://upstash.com/docs/redis/sdks/ratelimit-ts/overview).
 */
const rateLimit = new Map<string, { count: number; resetTime: number }>();

let _callCount = 0;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  if (++_callCount % 100 === 0) {
    const now = Date.now();
    for (const [k, entry] of rateLimit) {
      if (now > entry.resetTime) rateLimit.delete(k);
    }
  }

  const now = Date.now();
  const entry = rateLimit.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
