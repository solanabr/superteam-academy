import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProgressService } from "@/lib/services";

const VALID_TIMEFRAMES = new Set(["weekly", "monthly", "alltime"]);

export async function GET(request: NextRequest) {
  const timeframe = request.nextUrl.searchParams.get("timeframe") ?? "weekly";

  if (!VALID_TIMEFRAMES.has(timeframe)) {
    return NextResponse.json(
      { error: "Invalid timeframe. Must be 'weekly', 'monthly', or 'alltime'" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const service = getProgressService(supabase);
    const entries = await service.getLeaderboard(
      timeframe as "weekly" | "monthly" | "alltime"
    );

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
