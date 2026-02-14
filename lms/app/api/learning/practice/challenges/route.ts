import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";
import { fetchSanityPracticeChallenges } from "@/lib/services/sanity-practice";

export async function GET() {
  await connectDB();

  const sanityChallenges = await fetchSanityPracticeChallenges();
  const challenges = sanityChallenges.length > 0 ? sanityChallenges : PRACTICE_CHALLENGES;

  // Count solves per challenge across all users
  const solveCounts = await User.aggregate([
    { $unwind: "$completedPractice" },
    { $group: { _id: "$completedPractice", count: { $sum: 1 } } },
  ]);

  const solveMap = new Map(solveCounts.map((s) => [s._id, s.count]));

  const result = challenges.map((c) => ({
    ...c,
    totalSolves: solveMap.get(c.id) ?? 0,
  }));

  return NextResponse.json(result);
}
