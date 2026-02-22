import { NextRequest, NextResponse } from "next/server";
import { leaderboardService } from "@/services/leaderboard";

export async function GET(req: NextRequest) {
  const timeframe = (req.nextUrl.searchParams.get("timeframe") ?? "alltime") as
    | "weekly"
    | "monthly"
    | "alltime";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);

  const entries = await leaderboardService.getLeaderboard(timeframe, limit);
  return NextResponse.json(entries);
}
