import { NextRequest, NextResponse } from "next/server";
import {
  getCachedLeaderboard,
  type LeaderboardTimeframe,
} from "@/lib/leaderboard/global";

const VALID_TIMEFRAMES = new Set(["weekly", "monthly", "alltime"]);

// Public, same-for-everyone data via the cookieless anon client — no cookies,
// no Set-Cookie, so the CDN may cache it. `CDN-Cache-Control` is required:
// Vercel strips a bare `s-maxage` from responses it does not CDN-cache itself.
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function GET(request: NextRequest) {
  const timeframe = request.nextUrl.searchParams.get("timeframe") ?? "weekly";

  if (!VALID_TIMEFRAMES.has(timeframe)) {
    return NextResponse.json(
      { error: "Invalid timeframe. Must be 'weekly', 'monthly', or 'alltime'" },
      { status: 400 }
    );
  }

  try {
    const entries = await getCachedLeaderboard(
      timeframe as LeaderboardTimeframe
    );
    return NextResponse.json({ entries }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
