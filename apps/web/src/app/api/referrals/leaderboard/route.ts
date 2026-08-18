import { NextRequest, NextResponse } from "next/server";
import { getReferralLeaderboard } from "@/lib/referrals/server";

// Per-request DB access — never statically prerender (DYNAMIC_SERVER_USAGE).
export const dynamic = "force-dynamic";

/**
 * Public season standings (mirrors /api/leaderboard). `?season=N` shows a past
 * season's final board — winners stay queryable after a season closes; no
 * param means the season covering now.
 */
export async function GET(request: NextRequest) {
  const seasonParam = request.nextUrl.searchParams.get("season");
  let season: number | null = null;
  if (seasonParam !== null) {
    season = Number.parseInt(seasonParam, 10);
    if (!Number.isInteger(season) || season < 1 || season > 10_000) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }
  }

  try {
    const { season: seasonInfo, standings } = await getReferralLeaderboard(
      season,
      20
    );
    return NextResponse.json({ season: seasonInfo, standings });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch referral leaderboard" },
      { status: 500 }
    );
  }
}
