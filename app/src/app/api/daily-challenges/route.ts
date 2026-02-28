import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getTodayChallenge, getTodayKey, getRecentChallenges } from "@/lib/daily-challenges";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "today";

  if (mode === "recent") {
    const challenges = getRecentChallenges(6);
    const userId = await resolveUserId();
    let completions: { date: string; xpEarned: number }[] = [];

    if (userId) {
      const dbCompletions = await prisma.dailyChallengeCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 7,
      });
      completions = dbCompletions.map((c) => ({
        date: c.date,
        xpEarned: c.xpEarned,
      }));
    }

    return NextResponse.json({ challenges, completions });
  }

  // Default: today's challenge
  const challenge = getTodayChallenge();
  const dateKey = getTodayKey();

  let completed = false;
  const userId = await resolveUserId();
  if (userId) {
    const existing = await prisma.dailyChallengeCompletion.findUnique({
      where: { userId_date: { userId, date: dateKey } },
    });
    completed = !!existing;
  }

  return NextResponse.json({ challenge, dateKey, completed });
}

export async function POST(request: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { challengeId, xpEarned } = body;
  const dateKey = getTodayKey();

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_date: { userId, date: dateKey } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already completed today" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.dailyChallengeCompletion.create({
      data: {
        userId,
        challengeId,
        date: dateKey,
        xpEarned: xpEarned ?? 50,
      },
    }),
    prisma.xPEvent.create({
      data: {
        userId,
        amount: xpEarned ?? 50,
        source: "daily_challenge",
        sourceId: challengeId,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
