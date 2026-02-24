import { NextRequest, NextResponse } from "next/server";
import { leaderboardService } from "@/services/leaderboard";

export async function GET(req: NextRequest) {
  const timeframe = (req.nextUrl.searchParams.get("timeframe") ?? "alltime") as
    | "weekly"
    | "monthly"
    | "alltime";
  const courseId = req.nextUrl.searchParams.get("courseId") ?? undefined;
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;

  const { entries, lastSyncedAt } = await leaderboardService.getLeaderboard({
    timeframe,
    courseId,
  });

  let userRank = -1;
  let userEntry = null;

  if (userId) {
    userRank = await leaderboardService.getUserRank({ userId, timeframe, courseId });
    userEntry = entries.find((e) => e.userId === userId) || null;
  }

  return NextResponse.json({ entries, userRank, userEntry, lastSyncedAt });
}
