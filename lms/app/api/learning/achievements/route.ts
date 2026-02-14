import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/db/helpers";
import { ACHIEVEMENTS } from "@/types/gamification";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(ACHIEVEMENTS);

  const user = await ensureUser(userId);
  const result = ACHIEVEMENTS.map((a) => ({
    ...a,
    claimed: user.claimedAchievements.includes(a.id),
  }));

  return NextResponse.json(result);
}
