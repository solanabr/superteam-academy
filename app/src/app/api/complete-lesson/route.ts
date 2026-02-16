import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

/** POST /api/complete-lesson — mark lesson complete. Body: { wallet, courseId, lessonIndex, xpReward? } */
export async function POST(request: NextRequest) {
  let body: { wallet?: string; courseId?: string; lessonIndex?: number; xpReward?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { wallet, courseId, lessonIndex, xpReward = 10 } = body;
  if (wallet == null || courseId == null || lessonIndex == null) {
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
  await service.completeLesson({
    userId: user.id,
    courseId,
    lessonIndex,
    xpReward,
  });
  return NextResponse.json({ ok: true });
}
