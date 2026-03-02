import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/leaderboard?limit=20
 *
 * Returns XP leaderboard. In production:
 * 1. Queries Helius getTokenAccounts for XP mint holders
 * 2. Sorts by balance descending
 * 3. Caches in Supabase leaderboard_cache table
 * 4. Returns cached data with TTL
 *
 * Query params:
 *   limit (number, default 20)
 *
 * Response:
 *   { entries: Array<{ wallet: string, xp: number, level: number, rank: number }> }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  // Stub leaderboard data
  const entries = Array.from({ length: limit }, (_, i) => {
    const xp = Math.floor(10000 * Math.exp(-i * 0.15));
    return {
      wallet: `${randomHex(4)}...${randomHex(4)}`,
      xp,
      level: Math.floor(Math.sqrt(xp / 100)),
      rank: i + 1,
    };
  });

  return NextResponse.json({ entries });
}

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
