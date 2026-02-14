import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getUtcDay } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({
      current: 0, longest: 0, lastActivityDate: 0, freezesAvailable: 0, history: [],
    });
  }

  const user = await ensureUser(userId);
  const streak = user.streak;
  const today = getUtcDay();
  const history = [];
  for (let i = 29; i >= 0; i--) {
    const day = today - i;
    const date = new Date(day * 86400 * 1000).toISOString().split("T")[0];
    history.push({
      date,
      active: day >= streak.lastDay - streak.current + 1 && day <= streak.lastDay,
      frozen: false,
    });
  }

  return NextResponse.json({
    current: streak.current,
    longest: streak.longest,
    lastActivityDate: streak.lastDay * 86400,
    freezesAvailable: 0,
    history,
  });
}
