import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { buildRecreatePreflight } from "@/lib/admin/recreate-preflight";

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
 * (RPC/DB) is a 500. Admin-gated with the same cookie + same-origin (CSRF)
 * check the POST route uses.
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
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(
      `[admin/courses/recreate/preflight] ${courseId}: ${message}`
    );
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
