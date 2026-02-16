import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

/** GET /api/progress?wallet=... — progress for user (xp, streak). */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ xp: 0, level: 0, currentStreak: 0, longestStreak: 0 });
  }
  const service = createLearningProgressService(prisma);
  const progress = await service.getProgress(user.id);
  const xp = progress?.xp ?? 0;
  const level = Math.floor(Math.sqrt(xp / 100));
  return NextResponse.json({
    xp,
    level,
    currentStreak: progress?.currentStreak ?? 0,
    longestStreak: progress?.longestStreak ?? 0,
  });
}
