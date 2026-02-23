import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { ensureUser, getUtcDay } from "@/lib/db/helpers";
import { practiceIdToAchievementIndex } from "@/lib/data/practice-challenges";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig } from "@/lib/solana/readers";
import { buildClaimAchievementTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId, challengeId, xpReward } = await req.json();
  if (!userId || !challengeId || xpReward === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const isDailyArchive = challengeId.startsWith("daily-");
  const achievementIndex = isDailyArchive
    ? null
    : practiceIdToAchievementIndex(challengeId);
  if (!isDailyArchive && achievementIndex === null) {
    return NextResponse.json({ error: "invalid challenge" }, { status: 400 });
  }

  let txSignature: string | null = null;

  // On-chain: claim_achievement with mapped index (best-effort)
  // Daily archive challenges skip bitmap — use memo tx only
  if (achievementIndex !== null) {
    try {
      const connection = getConnection();
      const backendKeypair = getBackendSigner();
      const program = getBackendProgram(backendKeypair);
      const wallet = new PublicKey(userId);

      const config = await fetchConfig();
      if (config && !config.seasonClosed) {
        const tx = await buildClaimAchievementTx(
          program,
          backendKeypair.publicKey,
          wallet,
          achievementIndex,
          xpReward,
          config.xpMint,
        );
        tx.feePayer = backendKeypair.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        txSignature = await sendAndConfirmTransaction(connection, tx, [
          backendKeypair,
        ]);
      }
    } catch (err: any) {
      const errMsg = err?.message ?? "";
      if (
        errMsg.includes("AchievementAlreadyClaimed") ||
        errMsg.includes("6008")
      ) {
        // proceed to MongoDB sync
      } else {
        console.warn(
          "[practice/complete] on-chain tx failed, falling back to MongoDB:",
          errMsg,
        );
      }
    }
  }

  // MongoDB sync (backup)
  const user = await ensureUser(userId);
  if (!user.completedPractice.includes(challengeId)) {
    user.completedPractice.push(challengeId);
    user.xp += xpReward;

    if (txSignature) {
      user.practiceTxHashes.set(challengeId, txSignature);
    }

    const today = getUtcDay();
    if (today > user.streak.lastDay) {
      if (today === user.streak.lastDay + 1) {
        user.streak.current += 1;
      } else {
        user.streak.current = 1;
      }
      user.streak.lastDay = today;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    }

    await user.save();
  }

  return NextResponse.json({ ok: true, txSignature });
}
