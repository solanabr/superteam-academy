import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/**
 * A confirmed admin sent a state-changing request that isn't JSON. Subclasses
 * AdminAuthError so a route's existing catch still refuses the request.
 */
export class AdminContentTypeError extends AdminAuthError {}

/**
 * Session-based admin check (replaces the retired ADMIN_SECRET/HMAC-cookie
 * system). Reads the Supabase session from the request cookies, then checks
 * the `admin_users` allowlist via the service-role client — the table has RLS
 * on with ZERO policies and explicit REVOKEs, so no client role can read it.
 *
 * Fail closed on EVERYTHING: no session, expired session, DB error, missing
 * env — all return null. Never trusts a client-supplied id; the user id comes
 * exclusively from `supabase.auth.getUser()` (server-verified against the
 * auth server, not just the cookie's claims).
 */
export async function requireAdmin(): Promise<{ userId: string } | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.id) return null;

    const admin = createAdminClient();
    const { data, error: dbError } = await admin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (dbError || !data) return null;

    return { userId: user.id };
  } catch {
    return null;
  }
}

/**
 * Rejects state-changing requests that are not same-origin, as a CSRF defense
 * layered on top of the session cookie's SameSite attribute.
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
 * Admin mutations are JSON-only, on top of the same-origin check rather than in
 * place of it: every admin POST parses a JSON body. Safe methods carry no body,
 * so they're exempt. Compares the bare media type, ignoring case and parameters
 * like charset.
 */
function hasJsonContentType(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return true;

  const mediaType = req.headers.get("content-type")?.split(";")[0];
  return mediaType?.trim().toLowerCase() === "application/json";
}

/**
 * Authorizes an admin API request via the caller's Supabase session and the
 * `admin_users` allowlist (see {@link requireAdmin}). Throws AdminAuthError if
 * the session is missing/invalid, the user is not on the allowlist, or a
 * state-changing request fails the same-origin (CSRF) check. Throws its
 * AdminContentTypeError subclass if a confirmed admin's state-changing request
 * isn't JSON. That check runs last so the distinct answer only ever reaches an
 * admin. Returns the acting admin's user id so routes can attribute logged
 * actions.
 */
export async function requireAdminAuth(
  req: Request
): Promise<{ userId: string }> {
  if (!isSameOriginRequest(req)) {
    throw new AdminAuthError();
  }
  const admin = await requireAdmin();
  if (!admin) {
    throw new AdminAuthError();
  }
  if (!hasJsonContentType(req)) {
    throw new AdminContentTypeError();
  }
  return admin;
}

/**
 * The response for an error caught from {@link requireAdminAuth}: a 415 for
 * {@link AdminContentTypeError}, otherwise a 401. Handlers that accept a body
 * must pass the error on, or an admin's missing header reads as a dead session.
 *
 * Usage:
 *   try { await requireAdminAuth(req) } catch (e) {
 *     if (e instanceof AdminAuthError) return adminUnauthorizedResponse(e);
 *     throw e;
 *   }
 */
export function adminUnauthorizedResponse(error?: unknown): NextResponse {
  if (error instanceof AdminContentTypeError) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 415 }
    );
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
