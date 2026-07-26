import { NextRequest, NextResponse } from "next/server";
import type { CohortLeague } from "@superteam-lms/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCohortLeaderboard } from "@/lib/leaderboard/cohort";
import { deriveCohortStrip } from "@/lib/leaderboard/cohort-window";
import { serverEnv } from "@/lib/env.server";

// Auth/cookie + per-request DB access — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * Weekly cohort league for the signed-in learner (LX-B9b). `?window=strip`
 * returns only the "you ±3" nearby-rank slice (derived server-side over the
 * snapshot board); otherwise the full cohort. The board RPC assigns the learner
 * lazily on first read and reads materialized snapshot scores.
 */
export async function GET(request: NextRequest) {
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
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const league = await getCohortLeaderboard(admin, user.id);

    if (!league) {
      return NextResponse.json({ league: null });
    }

    const strip = request.nextUrl.searchParams.get("window") === "strip";
    const payload: CohortLeague = strip
      ? { ...league, entries: deriveCohortStrip(league.entries) }
      : league;

    return NextResponse.json({ league: payload });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch cohort league" },
      { status: 500 }
    );
  }
}
