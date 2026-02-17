import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { DailyChallenge } from "@/lib/db/models/daily-challenge";

function getBrtDate(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

export async function GET() {
  await connectDB();

  const today = getBrtDate();

  // All past daily challenges (not today's — today's is the active daily)
  const past = await DailyChallenge.find({ date: { $lt: today } })
    .sort({ date: -1 })
    .lean();

  const challenges = past.map((doc) => ({
    id: `daily-${doc.date}`,
    title: doc.title,
    description: doc.description,
    difficulty: doc.difficulty,
    category: doc.category,
    language: doc.language,
    xpReward: doc.xpReward,
    tags: ["daily-challenge"],
    challenge: {
      language: doc.language,
      prompt: doc.description,
      starterCode: doc.starterCode,
      solution: doc.solution,
      testCases: doc.testCases.map((tc: any) => ({
        id: tc.id,
        name: tc.name,
        input: tc.input,
        expectedOutput: tc.expected,
      })),
      hints: doc.hints,
    },
  }));

  return NextResponse.json(challenges);
}
