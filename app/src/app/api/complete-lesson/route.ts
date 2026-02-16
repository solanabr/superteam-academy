import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

/**
 * POST /api/complete-lesson
 * Body: { wallet: string; courseId: string; lessonIndex: number; xpReward?: number }
 *
 * Stub implementation: uses Prisma-based LearningProgressService.
 */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; courseId?: string; lessonIndex?: number; xpReward?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wallet, courseId, lessonIndex, xpReward } = body;

  if (!wallet || !courseId || typeof lessonIndex !== "number") {
    return NextResponse.json(
      { error: "Missing wallet, courseId, or lessonIndex" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const service = createLearningProgressService(prisma);

  try {
    await service.completeLesson({
      userId: user.id,
      courseId,
      lessonIndex,
      xpReward: xpReward ?? 100, // Simple stub XP reward per lesson
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to complete lesson" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

