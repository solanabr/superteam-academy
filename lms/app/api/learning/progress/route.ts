import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { getAllCourses } from "@/lib/db/course-helpers";
import { fetchSanityCourses } from "@/lib/services/sanity-courses";
import {
  fetchEnrollment,
  fetchCourse,
  bitmapToLessonIndices,
} from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  // Always query MongoDB as the source of truth for completedAt and tx hashes
  await connectDB();
  const dbEnrollments = await Enrollment.find({ userId }).lean();
  const dbMap = new Map(
    dbEnrollments.map((e) => [
      e.courseId,
      {
        courseId: e.courseId,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt?.toISOString() ?? undefined,
        lessonsCompleted: e.lessonsCompleted,
        totalLessons: e.totalLessons,
        percentComplete: e.percentComplete,
        lessonTxHashes:
          (e as any).lessonTxHashes instanceof Map
            ? Object.fromEntries((e as any).lessonTxHashes)
            : ((e as any).lessonTxHashes ?? {}),
        enrollTxHash: (e as any).enrollTxHash ?? undefined,
        completionTxHash: (e as any).completionTxHash ?? undefined,
      },
    ]),
  );

  // Enrich with on-chain data where available
  try {
    const wallet = new PublicKey(userId);
    const dbCourses = await getAllCourses();
    const sanityCourses = await fetchSanityCourses();
    const allCourses = [
      ...dbCourses,
      ...sanityCourses.filter((sc) => !dbCourses.some((s) => s.id === sc.id)),
    ];
    for (const knownCourse of allCourses) {
      const enrollment = await fetchEnrollment(knownCourse.id, wallet);
      if (!enrollment) continue;

      const course = await fetchCourse(knownCourse.id);
      const lessonsCompleted = bitmapToLessonIndices(enrollment.lessonFlags);
      const totalLessons = course?.lessonCount ?? knownCourse.lessonCount;
      const completedAtRaw = enrollment.completedAt;
      const onChainCompletedAt =
        completedAtRaw &&
        Number(
          typeof completedAtRaw === "object" &&
            "toNumber" in (completedAtRaw as any)
            ? (completedAtRaw as any).toNumber()
            : completedAtRaw,
        ) > 0
          ? new Date(
              Number(
                typeof completedAtRaw === "object" &&
                  "toNumber" in (completedAtRaw as any)
                  ? (completedAtRaw as any).toNumber()
                  : completedAtRaw,
              ) * 1000,
            ).toISOString()
          : undefined;
      const enrolledAt = new Date(
        (typeof enrollment.enrolledAt === "object" &&
        "toNumber" in (enrollment.enrolledAt as any)
          ? (enrollment.enrolledAt as any).toNumber()
          : Number(enrollment.enrolledAt)) * 1000,
      ).toISOString();

      const db = dbMap.get(knownCourse.id);
      dbMap.set(knownCourse.id, {
        courseId: knownCourse.id,
        enrolledAt,
        completedAt: onChainCompletedAt ?? db?.completedAt,
        lessonsCompleted,
        totalLessons,
        percentComplete:
          totalLessons > 0 ? (lessonsCompleted.length / totalLessons) * 100 : 0,
        lessonTxHashes: db?.lessonTxHashes ?? {},
        enrollTxHash: db?.enrollTxHash,
        completionTxHash: db?.completionTxHash,
      });
    }
  } catch {
    // on-chain unavailable, MongoDB data stands as-is
  }

  return NextResponse.json([...dbMap.values()]);
}
