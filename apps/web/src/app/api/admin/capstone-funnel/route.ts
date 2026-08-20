import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCapstoneFunnel } from "@/lib/credentials/capstone-funnel";
import { logEvent } from "@/lib/logging";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * Capstone credential funnel (#725). Aggregate counts of the four stages a
 * learner passes through toward the capstone credential, so a broken
 * `/api/deploy/save` — which writes no `deployed_programs` row and is otherwise
 * indistinguishable from the gate correctly withholding — becomes visible at a
 * glance. Admin-authed, service-role aggregate reads only (no PII).
 *
 * Returns 200 with the counters + a `verdict`. When the funnel shows the
 * write-path-broken signature (`write_path_suspect`) it also emits a loud
 * structured log line, so the same fact reaches log-based alerting and not
 * only whoever happens to open this route.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  const funnel = await getCapstoneFunnel(createAdminClient());

  if (funnel.verdict === "write_path_suspect") {
    logEvent({
      event: "capstone-funnel.write_path_suspect",
      level: "error",
      context: {
        courseId: funnel.courseId,
        deployLessonId: funnel.deployLessonId,
        completions: funnel.completions,
        deploys: funnel.deploys,
        deferrals: funnel.deferrals,
      },
    });
  }

  return NextResponse.json(funnel);
}
