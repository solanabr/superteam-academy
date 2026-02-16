import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";

/** GET /api/enrollment?wallet=...&courseId=... — enrollment progress for a user in a course. */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!wallet || !courseId) {
    return NextResponse.json({ error: "Missing wallet or courseId" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json(null, { status: 404 });
  }
  const service = createLearningProgressService(prisma);
  const progress = await service.getEnrollmentProgress(user.id, courseId);
  if (!progress) {
    return NextResponse.json(null, { status: 404 });
  }
  return NextResponse.json({
    courseId: progress.courseId,
    completedCount: progress.completedCount,
    totalLessons: progress.totalLessons,
    completedAt: progress.completedAt,
  });
}
