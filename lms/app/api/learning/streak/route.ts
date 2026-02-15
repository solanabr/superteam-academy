import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser, getUtcDay } from "@/lib/db/helpers";
import { fetchLearnerProfile } from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({
      current: 0, longest: 0, lastActivityDate: 0, freezesAvailable: 0, history: [],
    });
  }

  let current = 0;
  let longest = 0;
  let lastDay = 0;
  let freezesAvailable = 0;

  // Try on-chain first
  try {
    const wallet = new PublicKey(userId);
    const profile = await fetchLearnerProfile(wallet);
    if (profile) {
      current = profile.currentStreak;
      longest = profile.longestStreak;
      lastDay = Math.floor(
        (typeof profile.lastActivityDate === "object" && "toNumber" in profile.lastActivityDate
          ? (profile.lastActivityDate as any).toNumber()
          : Number(profile.lastActivityDate)) / 86400
      );
      freezesAvailable = profile.streakFreezes;
    }
  } catch {
    // fallback to MongoDB
  }

  // Fallback if on-chain data not available
  if (current === 0 && longest === 0 && lastDay === 0) {
    const user = await ensureUser(userId);
    current = user.streak.current;
    longest = user.streak.longest;
    lastDay = user.streak.lastDay;
  }

  const today = getUtcDay();
  const history = [];
  for (let i = 29; i >= 0; i--) {
    const day = today - i;
    const date = new Date(day * 86400 * 1000).toISOString().split("T")[0];
    history.push({
      date,
      active: day >= lastDay - current + 1 && day <= lastDay,
      frozen: false,
    });
  }

  return NextResponse.json({
    current,
    longest,
    lastActivityDate: lastDay * 86400,
    freezesAvailable,
    history,
  });
}
