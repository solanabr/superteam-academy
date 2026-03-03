import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTodayKey } from "@/lib/daily-challenges";
import type { SpeedLeaderboardEntry } from "@/lib/daily-challenges";

export async function GET() {
  const dateKey = getTodayKey();

  const completions = await prisma.dailyChallengeCompletion.findMany({
    where: {
      date: dateKey,
      startedAt: { not: null },
      xpEarned: { gt: 0 },
    },
    orderBy: { completedAt: "asc" },
    take: 50,
  });

  // Calculate time and sort by fastest
  const withTime = completions
    .filter((c) => c.startedAt !== null)
    .map((c) => ({
      ...c,
      timeSeconds: Math.floor(
        (c.completedAt.getTime() - c.startedAt!.getTime()) / 1000,
      ),
    }))
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .slice(0, 10);

  // Fetch user details
  const userIds = withTime.map((c) => c.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      displayName: true,
      name: true,
      wallet: true,
      image: true,
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const entries: SpeedLeaderboardEntry[] = withTime.map((c, i) => {
    const user = userMap.get(c.userId);
    return {
      rank: i + 1,
      userId: c.userId,
      displayName: user?.displayName ?? user?.name ?? "Anonymous",
      wallet: user?.wallet ?? null,
      avatar: user?.image ?? null,
      timeSeconds: c.timeSeconds,
      testsPassed: c.testsPassed,
      totalTests: c.totalTests,
    };
  });

  return NextResponse.json({ entries });
}
