import { NextRequest, NextResponse } from "next/server";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { Thread } from "@/lib/db/models/thread";
import { Reply } from "@/lib/db/models/reply";
import { ensureUser } from "@/lib/db/helpers";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getConnection } from "@/lib/solana/connection";
import { sendMemoTx } from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId, threadId, replyId } = await req.json();
  if (!userId || !threadId || !replyId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();

  const thread = await Thread.findById(threadId);
  if (!thread) {
    return NextResponse.json({ error: "thread not found" }, { status: 404 });
  }
  if (thread.author !== userId) {
    return NextResponse.json({ error: "only thread author can mark solution" }, { status: 403 });
  }
  if (thread.type !== "question") {
    return NextResponse.json({ error: "only question threads can have solutions" }, { status: 400 });
  }

  const reply = await Reply.findById(replyId);
  if (!reply || reply.threadId !== threadId) {
    return NextResponse.json({ error: "reply not found" }, { status: 404 });
  }

  let txSignature: string | null = null;
  let bountyTxSignature: string | null = null;
  const hasBounty = thread.bountyLamports > 0 && !thread.bountyPaid;

  try {
    const backendKeypair = getBackendSigner();
    txSignature = await sendMemoTx(backendKeypair, {
      event: "mark_solution",
      wallet: userId,
      threadId,
      replyId,
      solverWallet: reply.author,
      ...(hasBounty && { bountyLamports: String(thread.bountyLamports) }),
      timestamp: new Date().toISOString(),
    });

    // Transfer SOL bounty to solver
    if (hasBounty) {
      const connection = getConnection();
      const recipient = new PublicKey(reply.author);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: backendKeypair.publicKey,
          toPubkey: recipient,
          lamports: thread.bountyLamports,
        })
      );
      tx.feePayer = backendKeypair.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      bountyTxSignature = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

      thread.bountyPaid = true;
      thread.bountyTxHash = bountyTxSignature;
    }
  } catch (err) {
    console.error("[mark-solution] error:", err instanceof Error ? err.message : err);
  }

  thread.isSolved = true;
  thread.solvedReplyId = replyId;
  await thread.save();

  // Award +25 points to solver
  const solver = await ensureUser(reply.author);
  solver.communityPoints += 25;
  await solver.save();

  return NextResponse.json({ ok: true, txSignature, bountyTxSignature });
}
