import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";

export class AdminAuthError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

const ADMIN_SESSION_COOKIE = "admin_session";

function readAdminSessionCookie(req: Request): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === ADMIN_SESSION_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/**
 * Authorizes an admin API request via the signed `admin_session` cookie.
 * The cookie is minted by POST /api/admin/auth once the secret is entered,
 * and sent automatically on same-origin fetches. The secret itself is never
 * held by the client, so it cannot leak into the page payload or be stolen
 * via XSS. Throws AdminAuthError if the cookie is missing/invalid/expired.
 */
export function requireAdminAuth(req: Request): void {
  if (!isValidAdminSession(readAdminSessionCookie(req))) {
    throw new AdminAuthError();
  }
}

/**
 * Returns a 401 NextResponse for use in catch blocks.
 *
 * Usage:
 *   try { requireAdminAuth(req) } catch (e) {
 *     if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
 *     throw e;
 *   }
 */
export function adminUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const ADMIN_SESSION_MAX_AGE_MS = 86400 * 1000; // 24h

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const dotIndex = cookieValue.indexOf(".");
  if (dotIndex === -1) return false;

  const timestamp = cookieValue.slice(0, dotIndex);
  const signature = cookieValue.slice(dotIndex + 1);

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(timestamp)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const age = Date.now() - Number(timestamp);
  if (Number.isNaN(age) || age < 0 || age > ADMIN_SESSION_MAX_AGE_MS)
    return false;

  return true;
}
