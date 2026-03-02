import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
  getTodayChallenge,
  getTodayKey,
  getRecentChallenges,
  getAllPastChallenges,
} from "@/lib/daily-challenges";

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

  if (mode === "history") {
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const allPast = getAllPastChallenges();
    const visible = allPast.slice(0, limit);
    const userId = await resolveUserId();
    let completions: { date: string; xpEarned: number; challengeId: string }[] =
      [];

    if (userId) {
      const dbCompletions = await prisma.dailyChallengeCompletion.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
      });
      completions = dbCompletions.map((c) => ({
        date: c.date,
        xpEarned: c.xpEarned,
        challengeId: c.challengeId,
      }));
    }

    return NextResponse.json({
      challenges: visible,
      completions,
      total: allPast.length,
    });
  }

  // Default: today's challenge
  const challenge = getTodayChallenge();
  const dateKey = getTodayKey();

  let completed = false;
  let startedAt: string | null = null;
  const userId = await resolveUserId();
  if (userId) {
    const existing = await prisma.dailyChallengeCompletion.findUnique({
      where: { userId_date: { userId, date: dateKey } },
    });
    completed = !!existing && existing.xpEarned > 0;
    startedAt = existing?.startedAt?.toISOString() ?? null;
  }

  return NextResponse.json({ challenge, dateKey, completed, startedAt });
}

export async function POST(request: Request) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { challengeId, xpEarned, testsPassed, totalTests } = body;
  const dateKey = getTodayKey();

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_date: { userId, date: dateKey } },
  });

  if (existing && existing.xpEarned > 0) {
    return NextResponse.json(
      { error: "Already completed today" },
      { status: 409 },
    );
  }

  const earnedXp = xpEarned ?? 50;

  if (existing) {
    // Update existing start record with completion data
    await prisma.$transaction([
      prisma.dailyChallengeCompletion.update({
        where: { userId_date: { userId, date: dateKey } },
        data: {
          xpEarned: earnedXp,
          completedAt: new Date(),
          testsPassed: testsPassed ?? 0,
          totalTests: totalTests ?? 0,
        },
      }),
      prisma.xPEvent.create({
        data: {
          userId,
          amount: earnedXp,
          source: "daily_challenge",
          sourceId: challengeId,
        },
      }),
    ]);
  } else {
    // No start record exists — create fresh
    await prisma.$transaction([
      prisma.dailyChallengeCompletion.create({
        data: {
          userId,
          challengeId,
          date: dateKey,
          xpEarned: earnedXp,
          completedAt: new Date(),
          testsPassed: testsPassed ?? 0,
          totalTests: totalTests ?? 0,
        },
      }),
      prisma.xPEvent.create({
        data: {
          userId,
          amount: earnedXp,
          source: "daily_challenge",
          sourceId: challengeId,
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
