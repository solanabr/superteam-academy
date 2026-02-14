import { NextRequest, NextResponse } from "next/server";
import { ensureUser, getLevel } from "@/lib/db/helpers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);

  const user = await ensureUser(userId);
  return NextResponse.json({
    wallet: user.wallet,
    displayName: user.displayName,
    bio: user.bio,
    xp: user.xp,
    level: getLevel(user.xp),
    currentStreak: user.streak.current,
    longestStreak: user.streak.longest,
    lastActivityDate: user.streak.lastDay * 86400,
    streakFreezes: 0,
    achievementFlags: [0, 0, 0, 0],
    referralCount: 0,
    hasReferrer: false,
    joinedAt: user.joinedAt.toISOString(),
  });
}
