import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { ACHIEVEMENTS } from "@/types/gamification";
import { fetchLearnerProfile, isBitSet } from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(ACHIEVEMENTS);

  // Try on-chain first
  try {
    const wallet = new PublicKey(userId);
    const profile = await fetchLearnerProfile(wallet);
    if (profile) {
      const result = ACHIEVEMENTS.map((a) => ({
        ...a,
        claimed: isBitSet(profile.achievementFlags, a.id),
      }));
      return NextResponse.json(result);
    }
  } catch {
    // fallback to MongoDB
  }

  const user = await ensureUser(userId);
  const result = ACHIEVEMENTS.map((a) => ({
    ...a,
    claimed: user.claimedAchievements.includes(a.id),
  }));

  return NextResponse.json(result);
}
