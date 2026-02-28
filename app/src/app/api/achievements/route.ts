import { NextResponse, type NextRequest } from "next/server";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import { resolveUserId } from "@/lib/auth-utils";

const service = new PrismaProgressService();

export async function GET(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const achievements = await service.getAchievements(userId);
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
