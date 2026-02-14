import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getUtcDay } from "@/lib/db/helpers";

export async function POST(req: NextRequest) {
  const { userId, challengeId, xpReward } = await req.json();
  if (!userId || !challengeId || xpReward === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const user = await ensureUser(userId);
  if (user.completedPractice.includes(challengeId)) {
    return NextResponse.json({ ok: true });
  }

  user.completedPractice.push(challengeId);
  user.xp += xpReward;

  const today = getUtcDay();
  if (today > user.streak.lastDay) {
    if (today === user.streak.lastDay + 1) {
      user.streak.current += 1;
    } else {
      user.streak.current = 1;
    }
    user.streak.lastDay = today;
    if (user.streak.current > user.streak.longest) {
      user.streak.longest = user.streak.current;
    }
  }

  await user.save();
  return NextResponse.json({ ok: true });
}
