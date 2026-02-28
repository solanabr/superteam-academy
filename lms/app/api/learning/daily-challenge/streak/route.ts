import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "missing userId" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ wallet: userId });

  if (!user) {
    return NextResponse.json({
      current: 0,
      longest: 0,
      lastDay: "",
      completedDates: [],
    });
  }

  return NextResponse.json({
    current: user.dailyStreak?.current ?? 0,
    longest: user.dailyStreak?.longest ?? 0,
    lastDay: user.dailyStreak?.lastDay ?? "",
    completedDates: user.completedDailyChallenges ?? [],
  });
}
