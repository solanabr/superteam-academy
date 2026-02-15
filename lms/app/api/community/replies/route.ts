import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Reply } from "@/lib/db/models/reply";
import { Thread } from "@/lib/db/models/thread";
import { ensureUser } from "@/lib/db/helpers";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { sendMemoTx } from "@/lib/solana/transactions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "missing threadId" }, { status: 400 });
  }

  await connectDB();
  const replies = await Reply.find({ threadId }).sort({ createdAt: 1 }).lean();
  return NextResponse.json(replies);
}

export async function POST(req: NextRequest) {
  const { userId, threadId, body } = await req.json();
  if (!userId || !threadId || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  let txSignature: string | null = null;

  try {
    const backendKeypair = getBackendSigner();
    txSignature = await sendMemoTx(backendKeypair, {
      event: "reply_thread",
      wallet: userId,
      threadId,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // signer not configured
  }

  await connectDB();

  const reply = await Reply.create({
    threadId,
    author: userId,
    body,
    txHash: txSignature,
  });

  await Thread.findByIdAndUpdate(threadId, { $inc: { replyCount: 1 } });

  // Award points
  const user = await ensureUser(userId);
  user.communityPoints += 5;
  await user.save();

  return NextResponse.json({ ok: true, txSignature, reply });
}
