import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { fetchLearnerProfile, isBitSet } from "@/lib/solana/readers";
import {
  PRACTICE_CHALLENGES,
  achievementIndexToPracticeId,
} from "@/lib/data/practice-challenges";

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
  const claimedMilestones = user.claimedMilestones ?? [];
  const milestoneTxHashes: Record<string, string> = {};
  if (user.milestoneTxHashes) {
    for (const [k, v] of user.milestoneTxHashes.entries()) {
      milestoneTxHashes[k] = v;
    }
  }

  // Include daily archive completions as practice IDs
  const dailyCompleted = (user.completedDailyChallenges ?? []).map(
    (date: string) => `daily-${date}`,
  );
  if (user.dailyChallengeTxHashes) {
    for (const [date, hash] of user.dailyChallengeTxHashes.entries()) {
      txHashes[`daily-${date}`] = hash;
    }
  }

  // Merge on-chain bitmap + MongoDB completions (neither source is complete alone)
  const completedSet = new Set<string>(user.completedPractice);

  try {
    const wallet = new PublicKey(userId);
    const profile = await fetchLearnerProfile(wallet);
    if (profile) {
      for (let i = 0; i < PRACTICE_CHALLENGES.length; i++) {
        const bitIndex = PRACTICE_ACHIEVEMENT_OFFSET + i;
        if (isBitSet(profile.achievementFlags, bitIndex)) {
          const id = achievementIndexToPracticeId(bitIndex);
          if (id) completedSet.add(id);
        }
      }
    }
  } catch {
    // on-chain read failed, continue with MongoDB data
  }

  for (const dc of dailyCompleted) {
    completedSet.add(dc);
  }

  return NextResponse.json({
    completed: Array.from(completedSet),
    txHashes,
    claimedMilestones,
    milestoneTxHashes,
  });
}
