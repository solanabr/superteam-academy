import { NextResponse } from "next/server";
import { fetchLeaderboard } from "@/lib/services/xp-service";

export async function GET() {
  try {
    const entries = await fetchLeaderboard();
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
