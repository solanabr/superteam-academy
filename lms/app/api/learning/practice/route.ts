import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { fetchLearnerProfile, isBitSet } from "@/lib/solana/readers";
import { PRACTICE_CHALLENGES, achievementIndexToPracticeId } from "@/lib/data/practice-challenges";

const PRACTICE_ACHIEVEMENT_OFFSET = 64;

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  // Get tx hashes from MongoDB (on-chain doesn't store them)
  const user = await ensureUser(userId);
  const txHashes: Record<string, string> = {};
  if (user.practiceTxHashes) {
    for (const [k, v] of user.practiceTxHashes.entries()) {
      txHashes[k] = v;
    }
  }

  // Try on-chain first: read achievement_flags bitmap bits 64-138
  try {
    const wallet = new PublicKey(userId);
    const profile = await fetchLearnerProfile(wallet);
    if (profile) {
      const completed: string[] = [];
      for (let i = 0; i < PRACTICE_CHALLENGES.length; i++) {
        const bitIndex = PRACTICE_ACHIEVEMENT_OFFSET + i;
        if (isBitSet(profile.achievementFlags, bitIndex)) {
          const id = achievementIndexToPracticeId(bitIndex);
          if (id) completed.push(id);
        }
      }
      return NextResponse.json({ completed, txHashes });
    }
  } catch {
    // fallback to MongoDB
  }

  return NextResponse.json({
    completed: user.completedPractice,
    txHashes,
  });
}
