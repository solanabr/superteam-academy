import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { ensureUser } from "@/lib/db/helpers";
import { ACHIEVEMENTS } from "@/types/gamification";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig } from "@/lib/solana/readers";
import { buildClaimAchievementTx, sendMemoTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId, achievementId } = await req.json();
  if (!userId || achievementId === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!achievement) {
    return NextResponse.json({ error: "invalid achievement" }, { status: 400 });
  }

  let txSignature: string | null = null;

  // On-chain transaction
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
        achievementId,
        achievement.xpReward,
        config.currentMint,
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
      // proceed with MongoDB sync
    } else {
      console.warn(
        "[achievements/claim] on-chain tx failed, falling back to MongoDB:",
        errMsg,
      );
    }
  }

  // Fallback: send Memo tx if program tx didn't work
  if (!txSignature) {
    try {
      const backendKeypair = getBackendSigner();
      txSignature = await sendMemoTx(backendKeypair, {
        event: "achievement_claim",
        wallet: userId,
        achievementId: String(achievementId),
        achievementName: achievement.name,
        xpReward: String(achievement.xpReward),
        timestamp: new Date().toISOString(),
      });
    } catch {
      // no SOL or signer not configured
    }
  }

  // MongoDB sync
  const user = await ensureUser(userId);
  if (!user.claimedAchievements.includes(achievementId)) {
    user.claimedAchievements.push(achievementId);
    user.xp += achievement.xpReward;
    await user.save();
  }

  return NextResponse.json({ ok: true, txSignature });
}
