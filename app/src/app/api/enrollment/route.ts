import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLearningProgressService } from "@/lib/learning-progress/prisma-impl";
import { serverClient } from "@/sanity/lib/server-client";
import { learningProgressService } from "@/lib/learning-progress/service";

/** GET /api/enrollment?wallet=...&courseId=... — enrollment progress for a user in a course. */
export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  const courseId = request.nextUrl.searchParams.get("courseId");
  const isPolling = request.nextUrl.searchParams.get("poll") === "true";

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: wallet },
      select: { id: true },
    });

    if (!user) {
      if (isPolling) return NextResponse.json({ status: "pending" }, { status: 202 });
      return NextResponse.json(null, { status: 404 });
    }

    const service = learningProgressService;

    if (courseId) {
      // For On-Chain, we pass the wallet address directly as the identifier
      const identifier = process.env.NEXT_PUBLIC_USE_ONCHAIN === "true" ? (wallet as string) : user.id;
      const progress = await service.getEnrollmentProgress(identifier, courseId);
      if (!progress) {
        if (isPolling) return NextResponse.json({ status: "pending" }, { status: 202 });
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json({
        courseId: progress.courseId,
        completedCount: progress.completedCount,
        totalLessons: progress.totalLessons,
        completedAt: progress.completedAt,
        bonusClaimed: progress.bonusClaimed,
        lessonFlags: Array.from(progress.lessonFlags),
        onChainActive: progress.onChainActive,
      });
    } else {
      // List all enrollments with calculated progress
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate progress for each enrollment
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          // Fetch course to get total lesson count
          const course = await serverClient.fetch(
            `*[_type == "course" && _id == $id][0] {
              "totalLessons": count(modules[]->lessons[]->_id)
            }`,
            { id: enrollment.courseId }
          );

          const totalLessons = course?.totalLessons || 0;

          // Count completed lessons from bitmap
          let completedLessons = 0;
          const flags = enrollment.lessonFlags;
          for (let i = 0; i < flags.length * 8; i++) {
            const byteIdx = Math.floor(i / 8);
            const bitIdx = i % 8;
            if (flags[byteIdx] && (flags[byteIdx] & (1 << bitIdx))) {
              completedLessons++;
            }
          }

          const progressPercent = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          return {
            id: enrollment.id,
            courseId: enrollment.courseId,
            completedLessons,
            totalLessons,
            progressPercent,
            completedAt: enrollment.completedAt,
            bonusClaimed: enrollment.bonusClaimed,
            createdAt: enrollment.createdAt,
            updatedAt: enrollment.updatedAt,
          };
        })
      );

      return NextResponse.json(enrichedEnrollments);
    }
  } catch (error: any) {
    console.error("GET /api/enrollment error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}
