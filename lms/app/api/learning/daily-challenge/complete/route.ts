import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { connectDB } from "@/lib/db/mongodb";
import { DailyChallenge } from "@/lib/db/models/daily-challenge";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig } from "@/lib/solana/readers";
import { buildClaimAchievementTx, sendMemoTx } from "@/lib/solana/transactions";

const DAILY_ACHIEVEMENT_OFFSET = 200;
const DAILY_STREAK_MILESTONES = [7, 30, 100];

function getBrtDate(): string {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.toISOString().slice(0, 10);
}

function getPreviousBrtDate(brtDate: string): string {
  const d = new Date(brtDate + "T12:00:00Z");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const brtDate = getBrtDate();
  await connectDB();

  const challenge = await DailyChallenge.findOne({ date: brtDate });
  if (!challenge) {
    return NextResponse.json({ error: "no daily challenge for today" }, { status: 404 });
  }

  const user = await ensureUser(userId);
  if (user.completedDailyChallenges.includes(brtDate)) {
    return NextResponse.json({
      ok: true,
      txSignature: user.dailyChallengeTxHashes?.get(brtDate) ?? null,
      alreadyCompleted: true,
    });
  }

  let txSignature: string | null = null;
  const xpReward = challenge.xpReward;

  // On-chain: claim_achievement with daily challenge offset (best-effort)
  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const program = getBackendProgram(backendKeypair);
    const wallet = new PublicKey(userId);

    const config = await fetchConfig();
    if (config && !config.seasonClosed) {
      const dayNum = Math.floor(
        (new Date(brtDate).getTime() - new Date("2026-01-01").getTime()) / (24 * 60 * 60 * 1000)
      );
      const achievementIndex = DAILY_ACHIEVEMENT_OFFSET + (dayNum % 64);

      const tx = await buildClaimAchievementTx(
        program,
        backendKeypair.publicKey,
        wallet,
        achievementIndex,
        xpReward,
        config.currentMint
      );
      tx.feePayer = backendKeypair.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      txSignature = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
    }
  } catch (err: any) {
    const errMsg = err?.message ?? "";
    if (!errMsg.includes("AchievementAlreadyClaimed") && !errMsg.includes("6008")) {
      console.warn("[daily-challenge/complete] on-chain tx failed:", errMsg);
    }
  }

  // Fallback: memo tx
  if (!txSignature) {
    try {
      const backendKeypair = getBackendSigner();
      txSignature = await sendMemoTx(backendKeypair, {
        event: "daily_challenge_complete",
        wallet: userId,
        date: brtDate,
        xpReward: String(xpReward),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // no SOL or signer not configured
    }
  }

  // MongoDB: update user
  const practiceId = `daily-${brtDate}`;
  user.completedDailyChallenges.push(brtDate);
  if (!user.completedPractice.includes(practiceId)) {
    user.completedPractice.push(practiceId);
  }
  user.xp += xpReward;

  if (txSignature) {
    user.dailyChallengeTxHashes.set(brtDate, txSignature);
    user.practiceTxHashes.set(practiceId, txSignature);
  }

  // Daily streak logic
  const yesterday = getPreviousBrtDate(brtDate);
  if (user.dailyStreak.lastDay !== brtDate) {
    if (user.dailyStreak.lastDay === yesterday) {
      user.dailyStreak.current += 1;
    } else {
      user.dailyStreak.current = 1;
    }
    user.dailyStreak.lastDay = brtDate;
    if (user.dailyStreak.current > user.dailyStreak.longest) {
      user.dailyStreak.longest = user.dailyStreak.current;
    }
  }

  await user.save();

  // Check streak milestones — award achievement NFTs (fire-and-forget)
  const currentStreak = user.dailyStreak.current;
  for (const milestone of DAILY_STREAK_MILESTONES) {
    if (currentStreak === milestone) {
      try {
        const connection = getConnection();
        const backendKeypair = getBackendSigner();
        const program = getBackendProgram(backendKeypair);
        const wallet = new PublicKey(userId);
        const config = await fetchConfig();

        if (config && !config.seasonClosed) {
          const milestoneIndex = DAILY_ACHIEVEMENT_OFFSET + 64 + DAILY_STREAK_MILESTONES.indexOf(milestone);
          const milestoneXp = milestone * 2;
          const tx = await buildClaimAchievementTx(
            program,
            backendKeypair.publicKey,
            wallet,
            milestoneIndex,
            milestoneXp,
            config.currentMint
          );
          tx.feePayer = backendKeypair.publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
          user.xp += milestoneXp;
          await user.save();
        }
      } catch (err: any) {
        console.warn(`[daily-challenge] streak milestone ${milestone} on-chain failed:`, err?.message);
      }
      break;
    }
  }

  return NextResponse.json({ ok: true, txSignature });
}
