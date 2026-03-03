import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCached } from "@/lib/cache";
import { serverClient } from "@/sanity/lib/server-client";
import { countSetBits } from "@/lib/bitmap";

/**
 * GET /api/enrollment/list?wallet=...
 * Returns all enrollments for a user, enriched with Sanity course title/slug/track/difficulty.
 * Cached 60s per user (invalidated by the existing invalidatePattern("user:{wallet}*")).
 */
export async function GET(request: NextRequest) {
    const wallet = request.nextUrl.searchParams.get("wallet");
    if (!wallet) {
        return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { walletAddress: wallet },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json([], { status: 200 });
        }

        const enriched = await getCached(`user:${wallet}:enrollment-list`, async () => {
            const enrollments = await prisma.enrollment.findMany({
                where: { userId: user.id },
                orderBy: { updatedAt: "desc" },
            });

            if (enrollments.length === 0) return [];

            const courseIds = enrollments.map((e: { courseId: string }) => e.courseId);

            // Fetch course metadata from Sanity (title, slug, track, difficulty, duration)
            const courses = await serverClient.fetch<
                Array<{
                    _id: string;
                    title: string;
                    slug: string;
                    track?: string;
                    difficulty?: string;
                    duration?: string;
                    totalLessons: number;
                }>
            >(
                `*[_type == "course" && _id in $ids] {
          _id,
          title,
          "slug": slug.current,
          track,
          difficulty,
          duration,
          "totalLessons": count(modules[]->lessons[])
        }`,
                { ids: courseIds }
            );

            return enrollments.map((enrollment) => {
                const course = courses.find((c) => c._id === enrollment.courseId);
                const totalLessons = course?.totalLessons ?? 0;
                const completedLessons = enrollment.lessonFlags
                    ? countSetBits(enrollment.lessonFlags as Buffer)
                    : 0;

                return {
                    courseId: enrollment.courseId,
                    title: course?.title ?? "Unknown Course",
                    slug: course?.slug ?? "",
                    track: course?.track ?? null,
                    difficulty: course?.difficulty ?? null,
                    duration: course?.duration ?? null,
                    completedLessons,
                    totalLessons,
                    progressPercent:
                        totalLessons > 0
                            ? Math.round((completedLessons / totalLessons) * 100)
                            : 0,
                    completedAt: enrollment.completedAt ?? null,
                    bonusClaimed: enrollment.bonusClaimed,
                    updatedAt: enrollment.updatedAt,
                };
            });
        }, { ttl: 30 });

        return NextResponse.json(enriched);
    } catch (error: any) {
        console.error("GET /api/enrollment/list error:", error?.message ?? error);
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
}
