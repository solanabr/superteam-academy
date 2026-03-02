import { NextResponse, type NextRequest } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

// GET — public: returns all achievements; claimed status populated for authenticated users
export async function GET(_request: NextRequest) {
  const userId = await resolveUserId();
  const achievements = await service.getAchievements(userId ?? null);
  return NextResponse.json(achievements);
}

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { achievementId } = body;

  if (achievementId === undefined) {
    return NextResponse.json({ error: "Missing achievementId" }, { status: 400 });
  }

  await service.claimAchievement(userId, achievementId);

  return NextResponse.json({ success: true });
}
