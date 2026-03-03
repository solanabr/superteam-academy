import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** GET /api/progress?wallet=... — progress for user (xp, streak).
 *  Uses DIRECT Prisma reads for speed (<200ms) instead of on-chain service (6-7s).
 *  On-chain is kept in sync by Inngest background jobs.
 */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  try {
    // Fast path: read directly from Prisma (the fast query layer)
    // This avoids routing through service.getProgress() which goes on-chain (6-7s)
    const { getCached, invalidatePattern } = await import("@/lib/cache");

    const progress = await getCached(`user:${wallet}:progress`, async () => {
      const user = await prisma.user.findUnique({
        where: { walletAddress: wallet },
        select: { id: true }
      });

      if (!user) return null;

      const p = await prisma.progress.findUnique({
        where: { userId: user.id },
        select: {
          xp: true,
          currentStreak: true,
          longestStreak: true,
          lastActivityDate: true,
          achievementFlags: true,
        }
      });

      return p;
    }, { ttl: 30 });

    const xp = progress?.xp ?? 0;
    const level = Math.floor(Math.sqrt(xp / 100));

    // Log activity in background (fire-and-forget, non-blocking)
    import("@/lib/learning-progress/service").then(({ learningProgressService }) => {
      learningProgressService.logActivity(wallet).then(async (updated) => {
        if (updated) {
          await invalidatePattern(`user:${wallet}:progress`);
        }
      }).catch(err => {
        console.error("Background logActivity failed:", err);
      });
    }).catch(() => { });

    return NextResponse.json({
      xp,
      level,
      currentStreak: progress?.currentStreak ?? 0,
      longestStreak: progress?.longestStreak ?? 0,
      lastActivityDate: progress?.lastActivityDate ? new Date(progress.lastActivityDate).toISOString() : null,
      achievementFlags: progress?.achievementFlags ? Array.from(progress.achievementFlags as Uint8Array) : [],
    });
  } catch (error: any) {
    console.error("GET /api/progress error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}
