import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";
import { ACHIEVEMENTS } from "@/types/gamification";

export async function POST(req: NextRequest) {
  const { userId, achievementId } = await req.json();
  if (!userId || achievementId === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const user = await ensureUser(userId);
  if (user.claimedAchievements.includes(achievementId)) {
    return NextResponse.json({ ok: true });
  }

  user.claimedAchievements.push(achievementId);

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (achievement) {
    user.xp += achievement.xpReward;
  }

  await user.save();
  return NextResponse.json({ ok: true });
}
