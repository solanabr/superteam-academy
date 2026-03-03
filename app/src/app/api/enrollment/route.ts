import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serverClient } from "@/sanity/lib/server-client";

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

    if (courseId) {
      const { countSetBits } = await import("@/lib/bitmap");

      // DB-First: Read enrollment directly from Prisma (fast ~10ms)
      // On-chain is only used for writes (enroll/complete/graduate)
      const [enrollment, credential] = await Promise.all([
        prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } },
        }),
        // Prioritize courseId match, then lazy-fetch trackId for fallback
        prisma.credential.findFirst({
          where: { userId: user.id, courseId },
          select: { id: true, mintAddress: true }
        }).then(async (res) => {
          if (res) return res;
          // Lazy: only fetch course track from Sanity if no direct credential match
          const { getCourseById } = await import("@/sanity/lib/queries");
          const course = await getCourseById(courseId);
          const trackId = course?.track ?? courseId;
          return prisma.credential.findFirst({
            where: { userId: user.id, trackId },
            orderBy: { earnedAt: 'desc' },
            select: { id: true, mintAddress: true }
          });
        })
      ]);

      if (!enrollment) {
        if (isPolling) return NextResponse.json({ status: "pending" }, { status: 202 });
        return NextResponse.json(null, { status: 404 });
      }

      // Get totalLessons from Sanity (CDN-cached, fast)
      const { getCached } = await import("@/lib/cache");
      const totalLessons = await getCached(`course:${courseId}:lessonCount`, async () => {
        const result = await serverClient.fetch(
          `*[_type == "course" && _id == $id][0]{ "totalLessons": count(modules[]->lessons[]->_id) }`,
          { id: courseId }
        );
        return result?.totalLessons ?? 0;
      }, { ttl: 300 }); // Cache for 5 minutes — lesson count rarely changes

      const completedCount = countSetBits(enrollment.lessonFlags);

      return NextResponse.json({
        courseId: enrollment.courseId,
        completedCount,
        totalLessons,
        completedAt: enrollment.completedAt,
        bonusClaimed: enrollment.bonusClaimed,
        lessonFlags: Array.from(enrollment.lessonFlags),
        onChainActive: true, // If enrolled via on-chain, account exists
        mintAddress: credential?.mintAddress ?? null,
        credentialId: credential?.id ?? null,
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

        const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);
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
      }, { ttl: 30 });

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
