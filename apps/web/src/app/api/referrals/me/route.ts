import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOwnReferralStats } from "@/lib/referrals/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { serverEnv } from "@/lib/env.server";

// Auth/cookie + per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * The signed-in learner's referral surface: their share code (minted on first
 * ask), season points, lifetime referred signups, and the season window. The
 * code mint is server-side only (get_or_create_referral_code, service_role) —
 * the client never writes profiles.referral_code.
 */
export async function GET() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !serverEnv.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getOwnReferralStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    logError({
      errorId: ERROR_IDS.REFERRAL_STATS_FAILED,
      error: error instanceof Error ? error : new Error(String(error)),
      context: { route: "/api/referrals/me" },
    });
    return NextResponse.json(
      { error: "Failed to load referral stats" },
      { status: 500 }
    );
  }
}
