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

  // Fetch updated progress and enrollment to return
  const progress = await service.getProgress(user.id);
  const enrollment = await service.getEnrollmentProgress(user.id, courseId);
  const streak = await service.getStreak(user.id);

  // Use the achievement flags to determine new achievements (not fully implemented in stub)
  // For now, we return the flags and let the frontend check diffs if needed, 
  // or (better) we should return explicit "newAchievements" if the service can track that.
  // The service currently doesn't return "newly unlocked" from completeLesson.
  // We will enhance the service to return that later or let the frontend poll.
  // For now, returning the basics allows the frontend to show "XP: 100", "Streak: 1".

  return NextResponse.json({
    ok: true,
    data: {
      xp: progress?.xp ?? 0,
      streak: streak.currentStreak,
      completed: true, // Should be true if completeLesson didn't throw
      // enrollment: enrollment, // Optional if frontend needs it
    }
  });
}

