import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { learningProgressService as service } from "@/lib/learning-progress/service";

/** GET /api/progress?wallet=... — progress for user (xp, streak). */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ xp: 0, level: 0, currentStreak: 0, longestStreak: 0 });
    }

    // Use unified service (resolves to onchain or prisma based on env)
    const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? wallet : user.id;

    // 1. Log activity in background (independent of response)
    service.logActivity(identifier).catch(err => {
      console.error("Failed to log activity behind the scenes", err);
    });

    // 2. Fetch progress via Hybrid Cache (L1/L2)
    const { getCached } = await import("@/lib/cache");
    const progress = await getCached(`user:${wallet}:progress`, async () => {
      return await service.getProgress(identifier);
    }, { ttl: 60 });

    const xp = progress?.xp ?? 0;
    const level = Math.floor(Math.sqrt(xp / 100));

    return NextResponse.json({
      xp,
      level,
      currentStreak: progress?.currentStreak ?? 0,
      longestStreak: progress?.longestStreak ?? 0,
      achievementFlags: progress?.achievementFlags ? Array.from(progress.achievementFlags) : [],
    });
  } catch (error: any) {
    console.error("GET /api/progress error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}
