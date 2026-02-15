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

export async function POST(req: NextRequest) {
  const { userId, milestone } = await req.json();
  if (!userId || milestone === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (!PRACTICE_MILESTONES.includes(milestone)) {
    return NextResponse.json({ error: "invalid milestone" }, { status: 400 });
  }

  const user = await ensureUser(userId);

  if (user.completedPractice.length < milestone) {
    return NextResponse.json(
      { error: `need ${milestone} solved, have ${user.completedPractice.length}` },
      { status: 400 }
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
      })
    );
    tx.feePayer = backendKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    txSignature = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);
  } catch (err: any) {
    console.error("[claim-milestone] SOL transfer failed:", err?.message);
    return NextResponse.json({ error: "transfer failed" }, { status: 500 });
  }

  user.claimedMilestones.push(milestone);
  user.milestoneTxHashes.set(String(milestone), txSignature);
  await user.save();

  return NextResponse.json({ ok: true, txSignature });
}
