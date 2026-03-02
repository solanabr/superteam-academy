// Per-user in-memory token bucket rate limiter.
// Refills all tokens after each `refillIntervalMs` window elapses (fixed-window reset).
// NOTE: Store is process-local. On Vercel serverless, each isolate maintains independent
// state, so limits are per-instance, not globally enforced. For stronger guarantees,
// replace with Redis-backed rate limiting (e.g., @upstash/ratelimit).

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterOptions {
  maxTokens: number;
  refillIntervalMs: number;
}

const stores = new Map<string, Map<string, TokenBucket>>();

function getStore(namespace: string): Map<string, TokenBucket> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

export function isRateLimited(
  namespace: string,
  key: string,
  opts: RateLimiterOptions
): boolean {
  const store = getStore(namespace);
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket) {
    store.set(key, { tokens: opts.maxTokens - 1, lastRefill: now });
    return false;
  }

  const elapsed = now - bucket.lastRefill;
  const refills = Math.floor(elapsed / opts.refillIntervalMs);
  if (refills > 0) {
    bucket.tokens = Math.min(
      opts.maxTokens,
      bucket.tokens + refills * opts.maxTokens
    );
    bucket.lastRefill += refills * opts.refillIntervalMs;
  }

  if (bucket.tokens <= 0) {
    return true;
  }

  bucket.tokens--;
  return false;
}
