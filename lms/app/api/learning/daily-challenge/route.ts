import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { DailyChallenge } from "@/lib/db/models/daily-challenge";
import { User } from "@/lib/db/models/user";
import { generateDailyChallenge } from "@/lib/ai/generate-challenge";

function getBrtDate(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const brtDate = getBrtDate();

  await connectDB();

  let challenge = await DailyChallenge.findOne({ date: brtDate });

  if (!challenge) {
    // Collect ALL past daily challenge titles (sorted by date desc)
    const pastChallenges = await DailyChallenge.find(
      { date: { $ne: brtDate } },
      { title: 1, _id: 0 },
    )
      .sort({ date: -1 })
      .lean();
    const pastDailyTitles = pastChallenges.map((c) => c.title);

    const generated = await generateDailyChallenge(brtDate, pastDailyTitles);

    // Race condition guard: another request might have created today's challenge
    try {
      challenge = await DailyChallenge.create({
        date: brtDate,
        ...generated,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        challenge = await DailyChallenge.findOne({ date: brtDate });
      } else {
        throw err;
      }
    }
  }

  let completed = false;
  let txHash: string | null = null;
  let dailyStreak = { current: 0, longest: 0, lastDay: "" };

  if (userId) {
    const user = await User.findOne({ wallet: userId });
    if (user) {
      completed = user.completedDailyChallenges.includes(brtDate);
      txHash = user.dailyChallengeTxHashes?.get(brtDate) ?? null;
      dailyStreak = {
        current: user.dailyStreak?.current ?? 0,
        longest: user.dailyStreak?.longest ?? 0,
        lastDay: user.dailyStreak?.lastDay ?? "",
      };
    }
  }

  return NextResponse.json({
    date: challenge.date,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    category: challenge.category,
    language: challenge.language,
    xpReward: challenge.xpReward,
    starterCode: challenge.starterCode,
    solution: challenge.solution,
    testCases: challenge.testCases,
    hints: challenge.hints,
    completed,
    txHash,
    dailyStreak,
  });
}
