import { NextResponse, type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { PrismaProgressService } from "@/lib/services/prisma-progress";
import {
  loadBackendSigner,
  getServerConnection,
} from "@/lib/onchain/backend-signer";
import { buildCompleteLessonTransaction } from "@/lib/onchain/instructions/complete-lesson";
import {
  parseAnchorError,
  isAlreadyDoneError,
} from "@/lib/onchain/program-errors";
import { parseEventsFromLogs } from "@/lib/onchain/events";

const progressService = new PrismaProgressService();

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, lessonIndex, learnerWallet } = body as {
    courseId?: string;
    lessonIndex?: number;
    learnerWallet?: string;
  };

  if (!courseId || lessonIndex === undefined || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId, lessonIndex, or learnerWallet" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet: true },
  });
  if (!user?.wallet || user.wallet !== learnerWallet) {
    return NextResponse.json({ error: "Wallet mismatch" }, { status: 403 });
  }

  let learner: PublicKey;
  try {
    learner = new PublicKey(learnerWallet);
  } catch {
    return NextResponse.json(
      { error: "Invalid learnerWallet" },
      { status: 400 },
    );
  }

  const backendSigner = loadBackendSigner();
  const connection = getServerConnection();

  try {
    const tx = await buildCompleteLessonTransaction(
      courseId,
      learner,
      lessonIndex,
      backendSigner.publicKey,
      connection,
    );

    tx.sign(backendSigner);

    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    // Parse LessonCompleted event to get actual on-chain xpEarned
    let xpEarned: number | undefined;
    try {
      const txInfo = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const events = parseEventsFromLogs(txInfo?.meta?.logMessages ?? []);
      xpEarned = events.lessonCompleted?.xpEarned;
    } catch {
      // Non-fatal: event parsing is best-effort
    }

    // DB side-effect — non-fatal if it fails (on-chain already succeeded)
    try {
      await progressService.completeLesson(userId, courseId, lessonIndex);
    } catch (dbErr) {
      console.error(
        "[onchain/complete-lesson] DB update failed after on-chain success",
        dbErr,
      );
    }

    return NextResponse.json({ success: true, signature, xpEarned });
  } catch (err) {
    const { name } = parseAnchorError(err);

    if (isAlreadyDoneError(name)) {
      return NextResponse.json({ success: true });
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onchain/complete-lesson]", {
      userId,
      courseId,
      lessonIndex,
      error: msg,
    });
    return NextResponse.json({ error: name ?? msg }, { status: 500 });
  }
}
