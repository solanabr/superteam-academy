import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  getCachedLeaderboard,
  getRankForWallet,
} from "@/lib/server/leaderboard-cache";

const TOP = 100;

export async function GET() {
  const entries = await getCachedLeaderboard();
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
