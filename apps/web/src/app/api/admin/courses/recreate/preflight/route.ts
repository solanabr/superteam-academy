import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { buildRecreatePreflight } from "@/lib/admin/recreate-preflight";

/**
 * Scrub secret-bearing substrings out of a `reason`/error string before it is
 * returned to the browser (reasons are rendered verbatim and can flow into
 * client telemetry). Pure. Redacts, in order:
 *   1. any `https?://…` URL (an api-keyed RPC URL leaks the whole key),
 *   2. any leftover `?api-key=…` / `&api-key=…` query param not inside a URL,
 *   3. the known secret env identifiers `SOLANA_RPC_URL` / `PROGRAM_AUTHORITY_SECRET`.
 * Scoped to this NEW preflight GET route; the already-merged execute route
 * (`recreate/route.ts`) is a pre-existing follow-up, deliberately untouched.
 */
function sanitizeReason(reason: string): string {
  return reason
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .replace(/[?&]api-key=[^\s&]*/gi, "[redacted-api-key]")
    .replace(/SOLANA_RPC_URL/g, "[redacted-env]")
    .replace(/PROGRAM_AUTHORITY_SECRET/g, "[redacted-env]");
}

/**
 * GET /api/admin/courses/recreate/preflight?courseId=<id> — READ-ONLY.
 *
 * The non-destructive companion to the POST execute route: it resolves and
 * validates every create param (via {@link buildRecreatePreflight} →
 * `preflightRecreate`) and returns what the WS-2 confirm UI needs — the
 * immutable field diffs old→new, the resolved creator wallet, the live on-chain
 * lesson_count the recreate will default to (H3), the F4 "unusual creator" flag,
 * and the counters the recreate will reset. It performs NO on-chain write.
 *
 * A pre-flight REFUSAL is expected data for the UI, not an error: it comes back
 * as `{ canRecreate: false, reason }` with a 200. Only an unexpected failure
 * (RPC/DB) is a 500.
 *
 * Auth: this GET relies on the HMAC-signed `admin_session` cookie
 * (`requireAdminAuth`). The cookie is `SameSite=Strict`, so a cross-site GET
 * carries no cookie and is rejected with 401 — that, not an origin check, is the
 * boundary here. `isSameOriginRequest` returns true for a GET (no CSRF-mutation
 * surface), so the POST route's same-origin assertion is a no-op for GET and is
 * deliberately not applied; this handler is read-only regardless.
 *
 * Any `reason`/error string is scrubbed with {@link sanitizeReason} before it
 * leaves the server: refusal reasons from `preflightRecreate` can embed the
 * (api-keyed) RPC URL or secret env identifiers, which must not reach the client
 * or its telemetry.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const courseId = new URL(req.url).searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json(
      { error: "courseId is required" },
      { status: 400 }
    );
  }

  try {
    const data = await buildRecreatePreflight(courseId);
    // A refusal's `reason` is rendered verbatim client-side — scrub any secret
    // (api-keyed RPC URL, env identifiers) before it leaves the server.
    if (!data.canRecreate) {
      return NextResponse.json({
        ...data,
        reason: sanitizeReason(data.reason),
      });
    }
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // Log the raw message server-side; return only the sanitized form.
    console.error(`[admin/courses/recreate/preflight] ${courseId}: ${message}`);
    return NextResponse.json(
      { error: sanitizeReason(message) },
      { status: 500 }
    );
  }
}
