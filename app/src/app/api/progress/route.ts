import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gamificationService } from "@/services/gamification";
import { onChainProgressService } from "@/services/on-chain-progress";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, lessonIndex } = await req.json();
  if (!courseId || lessonIndex === undefined) {
    return NextResponse.json(
      { error: "courseId and lessonIndex required" },
      { status: 400 },
    );
  }

  if (!process.env.BACKEND_URL) {
    return NextResponse.json(
      { error: "Backend signer not configured — BACKEND_URL is missing." },
      { status: 503 },
    );
  }

  const walletAddress = session.walletAddress;

  if (!walletAddress) {
    return NextResponse.json(
      { error: "No wallet linked to your account. Link a wallet to record progress." },
      { status: 400 },
    );
  }

  const onChainResult = await onChainProgressService.completeLesson({
    courseId,
    lessonIndex,
    learnerWallet: walletAddress,
    userId: session.user.id,
  });

  if (!onChainResult.confirmed) {
    return NextResponse.json(
      { error: onChainResult.backendError ?? "Backend signer could not confirm the transaction." },
      { status: 502 },
    );
  }

  await gamificationService.recordActivity(session.user.id).catch(() => {});

  return NextResponse.json({
    success: true,
    xpEarned: onChainResult.xpEarned,
    finalized: onChainResult.finalized,
  });
}
