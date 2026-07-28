import "server-only";

import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminAuth,
  adminUnauthorizedResponse,
  AdminAuthError,
} from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlatformInsights } from "@/lib/admin/insights";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * Platform-behaviour aggregates for the admin Insights panel (#836): AI-tutor
 * usage, spend, and learning activity. Admin-authed, service-role aggregate
 * reads only — no PII leaves this route (same contract as the capstone
 * funnel, #725).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    requireAdminAuth(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return adminUnauthorizedResponse();
    throw e;
  }

  try {
    const insights = await getPlatformInsights(createAdminClient());
    return NextResponse.json(insights);
  } catch {
    // Generic message per route conventions — no stack traces to the client.
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}
