import { NextRequest, NextResponse } from "next/server";
import { getReferralLeaderboard } from "@/lib/referrals/server";

// Public, same-for-everyone standings (the `get_referral_leaderboard` RPC reads
// no auth.uid(); the client is the cookieless admin one) — CDN-cacheable.
// `CDN-Cache-Control` mirror required: Vercel strips a bare `s-maxage`.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

/**
 * Public season standings (mirrors /api/leaderboard). `?season=N` shows a past
 * season's final board — winners stay queryable after a season closes; no
 * param means the season covering now.
 */
export async function GET(request: NextRequest) {
  const seasonParam = request.nextUrl.searchParams.get("season");
  let season: number | null = null;
  if (seasonParam !== null) {
    // Strict shape check BEFORE parseInt: '1a', '+1', '1.9', '01' all parse to
    // a valid integer but would each mint a distinct CDN cache key against the
    // service-role RPC. One canonical spelling per season.
    if (!/^[1-9]\d{0,4}$/.test(seasonParam)) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }
    season = Number.parseInt(seasonParam, 10);
    if (season > 10_000) {
      return NextResponse.json({ error: "Invalid season" }, { status: 400 });
    }
  }

  try {
    const { season: seasonInfo, standings } = await getReferralLeaderboard(
      season,
      20
    );
    return NextResponse.json(
      { season: seasonInfo, standings },
      { headers: CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch referral leaderboard" },
      { status: 500 }
    );
  }
}
