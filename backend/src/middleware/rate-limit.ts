import { rateLimiter } from "hono-rate-limiter";

type ReqRaw = { socket?: { remoteAddress?: string } };

function getClientIp(c: { req: { header: (name: string) => string | undefined; raw: unknown } }): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp.trim();
  const raw = c.req.raw as ReqRaw | undefined;
  return raw?.socket?.remoteAddress ?? "unknown";
}

export const publicRateLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 120,
  keyGenerator: (c) => getClientIp(c),
  message: { error: "Too many requests" },
});

export const academyRateLimiter = rateLimiter({
  windowMs: 60_000,
  limit: 100,
  keyGenerator: (c) => getClientIp(c),
  message: { error: "Too many requests" },
});
