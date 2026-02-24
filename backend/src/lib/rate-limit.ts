import { Request } from "express";

const store = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of store) {
    if (now - ts > 60_000) store.delete(key);
  }
}, 60_000).unref?.();

export function isRateLimited(
  req: Request,
  applicationKey: string,
  windowMs = 5000
): boolean {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const key = `${ip}:${applicationKey}`;
  const last = store.get(key) ?? 0;
  if (Date.now() - last < windowMs) return true;
  store.set(key, Date.now());
  return false;
}
