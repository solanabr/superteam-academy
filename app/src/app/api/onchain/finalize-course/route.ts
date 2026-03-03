import { NextResponse, type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
  loadBackendSigner,
  getServerConnection,
} from "@/lib/onchain/backend-signer";
import { buildFinalizeCourseTransaction } from "@/lib/onchain/instructions/finalize-course";
import {
  parseAnchorError,
  isAlreadyDoneError,
} from "@/lib/onchain/program-errors";
import { parseEventsFromLogs } from "@/lib/onchain/events";

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, learnerWallet } = body as {
    courseId?: string;
    learnerWallet?: string;
  };

  if (!courseId || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId or learnerWallet" },
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
    const tx = await buildFinalizeCourseTransaction(
      courseId,
      learner,
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

    // Parse CourseFinalized event to get actual XP amounts
    let bonusXp: number | undefined;
    try {
      const txInfo = await connection.getTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });
      const events = parseEventsFromLogs(txInfo?.meta?.logMessages ?? []);
      bonusXp = events.courseFinalized?.bonusXp;
    } catch {
      // Non-fatal: event parsing is best-effort
    }

    // Mark enrollment complete in DB — non-fatal if it fails
    try {
      await prisma.enrollment.updateMany({
        where: { userId, courseId, completedAt: null },
        data: { completedAt: new Date() },
      });
    } catch (dbErr) {
      console.error(
        "[onchain/finalize-course] DB update failed after on-chain success",
        dbErr,
      );
    }

    return NextResponse.json({ success: true, signature, bonusXp });
  } catch (err) {
    const { name } = parseAnchorError(err);

    if (isAlreadyDoneError(name)) {
      return NextResponse.json({ success: true });
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onchain/finalize-course]", {
      userId,
      courseId,
      error: msg,
    });
    return NextResponse.json({ error: name ?? msg }, { status: 500 });
  }
}
