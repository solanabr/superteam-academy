import "server-only";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_MAX_AGE_MS } from "./session-format";
import { serverEnv } from "@/lib/env.server";

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
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        // Malformed percent-encoding (URIError): treat as no session so the
        // caller returns a clean 401 instead of a 500.
        return undefined;
      }
    }
  }
  return undefined;
}

/**
 * Rejects state-changing requests that are not same-origin, as a CSRF defense
 * layered on top of the cookie's SameSite=Strict attribute.
 *
 * Safe methods (GET/HEAD) are exempt — they must not mutate state, and skipping
 * the check keeps simple same-origin reads (and Origin-less navigations) working.
 *
 * For state-changing methods we trust two signals, in order:
 *   1. `Sec-Fetch-Site` — set by all modern browsers; only `same-origin` (and
 *      `none`, e.g. a user-typed URL) is allowed.
 *   2. `Origin` — fallback for clients that omit `Sec-Fetch-Site`; if present it
 *      must match the request's own origin.
 * A request with neither header present is allowed (e.g. server-to-server or
 * older non-browser clients), since CSRF requires a browser-attached cookie and
 * browsers always send at least one of these on cross-site requests.
 */
function isSameOriginRequest(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return true;

  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite !== null) {
    // `none` = user-initiated (typed URL / bookmark); `same-origin` = our own UI.
    return secFetchSite === "same-origin" || secFetchSite === "none";
  }

  const origin = req.headers.get("origin");
  if (origin !== null) {
    let originHost: string;
    try {
      originHost = new URL(origin).origin;
    } catch {
      return false;
    }
    let selfOrigin: string;
    try {
      selfOrigin = new URL(req.url).origin;
    } catch {
      return false;
    }
    return originHost === selfOrigin;
  }

  // Neither Sec-Fetch-Site nor Origin present: not a cross-site browser request.
  return true;
}

/**
 * Authorizes an admin API request via the signed `admin_session` cookie.
 * The cookie is minted by POST /api/admin/auth once the secret is entered,
 * and sent automatically on same-origin fetches. The secret itself is never
 * held by the client, so it cannot leak into the page payload or be stolen
 * via XSS. Throws AdminAuthError if the cookie is missing/invalid/expired,
 * or if a state-changing request fails the same-origin (CSRF) check.
 */
export function requireAdminAuth(req: Request): void {
  if (!isSameOriginRequest(req)) {
    throw new AdminAuthError();
  }
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

export function isValidAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = serverEnv.ADMIN_SECRET;
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
