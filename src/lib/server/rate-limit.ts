interface RateLimitInput {
  key: string;
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

type InMemoryEntry = {
  count: number;
  resetAt: number;
  lastSeen: number;
};

const MAX_IN_MEMORY_KEYS = 5_000;
const inMemoryStore = new Map<string, InMemoryEntry>();

function pruneInMemoryStore(now: number) {
  for (const [key, entry] of inMemoryStore) {
    if (entry.resetAt <= now) inMemoryStore.delete(key);
  }

  if (inMemoryStore.size <= MAX_IN_MEMORY_KEYS) return;

  const sortedByLastSeen = Array.from(inMemoryStore.entries()).sort(
    (a, b) => a[1].lastSeen - b[1].lastSeen,
  );
  const excess = inMemoryStore.size - MAX_IN_MEMORY_KEYS;
  for (let i = 0; i < excess; i += 1) {
    const [key] = sortedByLastSeen[i];
    inMemoryStore.delete(key);
  }
}

function checkInMemoryRateLimit(input: RateLimitInput): RateLimitResult {
  const { key, windowMs, maxRequests } = input;
  const now = Date.now();
  pruneInMemoryStore(now);

  const current = inMemoryStore.get(key);
  if (!current || current.resetAt <= now) {
    inMemoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
      lastSeen: now,
    });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterMs: windowMs,
    };
  }

  current.count += 1;
  current.lastSeen = now;

  const allowed = current.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - current.count);
  const retryAfterMs = Math.max(0, current.resetAt - now);
  return { allowed, remaining, retryAfterMs };
}

async function checkUpstashRateLimit(
  input: RateLimitInput,
  config: { url: string; token: string },
): Promise<RateLimitResult> {
  const { key, windowMs, maxRequests } = input;
  const expireSec = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `academy:rl:${key}`;

  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, expireSec, "NX"],
      ["PTTL", redisKey],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limiter HTTP ${response.status}`);
  }

  const payload = (await response.json()) as Array<{ result?: unknown }>;
  const count = Number(payload?.[0]?.result ?? 0);
  const ttlMsRaw = Number(payload?.[2]?.result ?? windowMs);
  const retryAfterMs = Number.isFinite(ttlMsRaw) && ttlMsRaw > 0 ? ttlMsRaw : windowMs;

  if (!Number.isFinite(count) || count < 1) {
    throw new Error("Invalid Upstash rate limiter response");
  }

  const allowed = count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - count),
    retryAfterMs,
  };
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      return await checkUpstashRateLimit(input, {
        url: upstashUrl,
        token: upstashToken,
      });
    } catch (error) {
      console.warn(
        "[rate-limit] Falling back to in-memory limiter:",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }

  return checkInMemoryRateLimit(input);
}

