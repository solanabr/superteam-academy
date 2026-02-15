import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Thread } from "@/lib/db/models/thread";
import { Reply } from "@/lib/db/models/reply";
import { ensureUser } from "@/lib/db/helpers";
import { getBackendSigner } from "@/lib/solana/backend-signer";
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

  try {
    const backendKeypair = getBackendSigner();
    txSignature = await sendMemoTx(backendKeypair, {
      event: "mark_solution",
      wallet: userId,
      threadId,
      replyId,
      solverWallet: reply.author,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // signer not configured
  }

  thread.isSolved = true;
  thread.solvedReplyId = replyId;
  await thread.save();

  // Award +25 points to solver
  const solver = await ensureUser(reply.author);
  solver.communityPoints += 25;
  await solver.save();

  return NextResponse.json({ ok: true, txSignature });
}
