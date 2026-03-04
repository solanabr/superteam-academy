import { NextRequest, NextResponse } from "next/server";
import { computeStreak } from "@/lib/backend/server-utils";
import { supabaseRest } from "@/lib/backend/server-supabase";

type StreakDayRow = {
  activity_day: string;
};

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  if (!learnerId) {
    return NextResponse.json({ current: 0, longest: 0, activeDays: [] }, { status: 400 });
  }
  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({ current: 0, longest: 0, activeDays: [] });
  }

  const rows = await supabaseRest.select<StreakDayRow>({
    table: "academy_streak_days",
    select: "activity_day",
    filters: { learner_id: `eq.${learnerId}` },
    order: "activity_day.asc",
  });

  const activeDays = (rows ?? []).map((row) => row.activity_day);
  const streak = computeStreak(activeDays);
  return NextResponse.json({
    current: streak.current,
    longest: streak.longest,
    activeDays,
  });
}
