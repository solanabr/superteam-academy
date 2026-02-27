import { jwtVerify } from "jose";

export const COOKIE_NAME = "admin-session";

export function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return new TextEncoder().encode(secret);
}

export function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Verify admin session from request cookie. Use in all admin API routes. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  try {
    const cookie = parseCookie(
      req.headers.get("cookie") ?? "",
      COOKIE_NAME,
    );
    if (!cookie) return false;
    await jwtVerify(cookie, getSecret());
    return true;
  } catch (error) {
    console.error("[admin] Session verification failed:", error);
    return false;
  }
}

/** @deprecated Use isAdminRequest(req) instead. */
export function isAdmin(_walletAddress: string): boolean {
  return false;
}
