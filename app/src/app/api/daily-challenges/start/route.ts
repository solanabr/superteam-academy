import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getTodayChallenge, getTodayKey } from "@/lib/daily-challenges";

export async function POST() {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateKey = getTodayKey();
  const challenge = getTodayChallenge();

  const existing = await prisma.dailyChallengeCompletion.findUnique({
    where: { userId_date: { userId, date: dateKey } },
  });

  if (existing) {
    return NextResponse.json({ startedAt: existing.startedAt });
  }

  const record = await prisma.dailyChallengeCompletion.create({
    data: {
      userId,
      challengeId: String(challenge.id),
      date: dateKey,
      xpEarned: 0,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ startedAt: record.startedAt });
}
