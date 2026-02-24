import { NextRequest } from "next/server";

const store = new Map<string, number>();

// Cleanup expired entries every 60s
setInterval(() => {
  const now = Date.now();
  store.forEach((ts, key) => {
    if (now - ts > 60_000) store.delete(key);
  });
}, 60_000).unref?.();

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * In-memory rate limiter keyed on IP + application key.
 * Returns true if the request should be rejected (rate limited).
 */
export function isRateLimited(
  req: NextRequest,
  applicationKey: string,
  windowMs = 5000
): boolean {
  const ip = getClientIp(req);
  const key = `${ip}:${applicationKey}`;
  const last = store.get(key) ?? 0;
  if (Date.now() - last < windowMs) return true;
  store.set(key, Date.now());
  return false;
}

/**
 * Express-compatible rate limiter for standalone backend.
 */
export function isRateLimitedExpress(
  ip: string,
  applicationKey: string,
  windowMs = 5000
): boolean {
  const key = `${ip}:${applicationKey}`;
  const last = store.get(key) ?? 0;
  if (Date.now() - last < windowMs) return true;
  store.set(key, Date.now());
  return false;
}
