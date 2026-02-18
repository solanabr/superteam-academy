import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getCachedLeaderboard,
  getRankForWallet,
  type TimeFilter,
} from "@/lib/server/leaderboard-cache";

const TOP = 100;
const VALID_FILTERS = new Set<TimeFilter>(["all", "monthly", "weekly"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";
  const filter: TimeFilter = VALID_FILTERS.has(filterParam as TimeFilter)
    ? (filterParam as TimeFilter)
    : "all";

  const entries = await getCachedLeaderboard(filter);
  const top = entries.slice(0, TOP);
  const user = await getAuthenticatedUser();
  let myRank: number | null = null;
  let myXp: number | null = null;
  if (user) {
    myRank = getRankForWallet(entries, user.walletAddress);
    const me = entries.find((e) => e.wallet === user.walletAddress);
    myXp = me?.xp ?? null;
  }
  return NextResponse.json({
    entries: top,
    myRank,
    myXp,
  });
}
