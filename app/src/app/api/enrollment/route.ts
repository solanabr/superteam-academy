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

      const { getCached } = await import("@/lib/cache");
      const [progress, credential] = await Promise.all([
        getCached(`user:${wallet}:enrollment:${courseId}`, async () => {
          return await service.getEnrollmentProgress(identifier, courseId);
        }, { ttl: 60 }),
        prisma.credential.findFirst({
          where: { userId: user.id, trackId: courseId },
          select: { mintAddress: true }
        })
      ]);

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
        mintAddress: credential?.mintAddress ?? null,
      });
    } else {
      // List all enrollments with calculated progress - Wrapped in Cache
      const { getCached } = await import("@/lib/cache");
      const enrichedEnrollments = await getCached(`user:${wallet}:enrollments`, async () => {
        const enrollments = await prisma.enrollment.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });

        if (enrollments.length === 0) return [];

        const courseIds = enrollments.map(e => e.courseId);
        const courses = await serverClient.fetch(
          `*[_type == "course" && _id in $ids] {
            _id,
            "totalLessons": count(modules[]->lessons[]->_id)
          }`,
          { ids: courseIds }
        );

        const { countSetBits } = await import("@/lib/bitmap");

        return enrollments.map((enrollment) => {
          const course = courses.find((c: any) => c._id === enrollment.courseId);
          const totalLessons = course?.totalLessons || 0;
          const completedLessons = countSetBits(enrollment.lessonFlags);

          return {
            id: enrollment.id,
            courseId: enrollment.courseId,
            completedLessons,
            totalLessons,
            progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            completedAt: enrollment.completedAt,
            bonusClaimed: enrollment.bonusClaimed,
            createdAt: enrollment.createdAt,
            updatedAt: enrollment.updatedAt,
          };
        });
      }, { ttl: 60 });

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
