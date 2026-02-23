import { NextRequest, NextResponse } from "next/server";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { MILESTONE_LEVELS, PRACTICE_MILESTONES } from "@/types/practice";
import { fetchLearnerProfile, isBitSet } from "@/lib/solana/readers";
import {
  PRACTICE_CHALLENGES,
  achievementIndexToPracticeId,
} from "@/lib/data/practice-challenges";

const PRACTICE_ACHIEVEMENT_OFFSET = 64;

export async function POST(req: NextRequest) {
  const { userId, milestone } = await req.json();
  if (!userId || milestone === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (!PRACTICE_MILESTONES.includes(milestone)) {
    return NextResponse.json({ error: "invalid milestone" }, { status: 400 });
  }

  const user = await ensureUser(userId);

  // Merge on-chain + MongoDB + daily challenges to get true solved count
  const completedSet = new Set<string>(user.completedPractice);

  // Add daily challenge completions
  for (const date of user.completedDailyChallenges ?? []) {
    completedSet.add(`daily-${date}`);
  }

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
    // continue with MongoDB count
  }

  const solvedCount = completedSet.size;
  console.log("[claim-milestone]", {
    userId,
    milestone,
    solvedCount,
    mongoCount: user.completedPractice.length,
    claimedMilestones: user.claimedMilestones,
  });

  if (solvedCount < milestone) {
    return NextResponse.json(
      { error: `need ${milestone} solved, have ${solvedCount}` },
      { status: 400 },
    );
  }

  if (user.claimedMilestones.includes(milestone)) {
    return NextResponse.json({ error: "already claimed" }, { status: 400 });
  }

  const level = MILESTONE_LEVELS[milestone];
  const lamports = Math.round(level.solReward * LAMPORTS_PER_SOL);

  let txSignature: string | null = null;

  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const recipient = new PublicKey(userId);

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: backendKeypair.publicKey,
        toPubkey: recipient,
        lamports,
      }),
    );
    tx.feePayer = backendKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    txSignature = await sendAndConfirmTransaction(connection, tx, [
      backendKeypair,
    ]);
  } catch (err: any) {
    console.error("[claim-milestone] SOL transfer failed:", err?.message);
    return NextResponse.json({ error: "transfer failed" }, { status: 500 });
  }

  user.claimedMilestones.push(milestone);
  user.milestoneTxHashes.set(String(milestone), txSignature);
  await user.save();

  return NextResponse.json({ ok: true, txSignature });
}
