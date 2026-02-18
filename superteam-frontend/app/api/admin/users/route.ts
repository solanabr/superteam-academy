import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/server/admin-auth";
import { getAllLearnerProfilesOnChain } from "@/lib/server/academy-chain-read";
import { getCachedLeaderboard } from "@/lib/server/leaderboard-cache";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const user = await checkPermission("users.read");
  if (!user) return unauthorized();
  const [profiles, leaderboard] = await Promise.all([
    getAllLearnerProfilesOnChain(),
    getCachedLeaderboard(),
  ]);
  const rankMap = new Map(leaderboard.map((e) => [e.wallet, e.rank]));
  const users = profiles.map((p) => ({
    wallet: p.authority,
    level: p.level,
    xp: p.xpTotal,
    streak: p.streakCurrent,
    streakLongest: p.streakLongest,
    lastActivityTs: p.lastActivityTs,
    rank: rankMap.get(p.authority) ?? null,
    address: p.address,
  }));
  return NextResponse.json(users);
}
