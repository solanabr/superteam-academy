import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchEnrollment, fetchCourse, bitmapToLessonIndices } from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  // Try on-chain first: iterate all known courses and check for enrollments
  try {
    const wallet = new PublicKey(userId);
    const results = [];
    for (const sampleCourse of SAMPLE_COURSES) {
      const enrollment = await fetchEnrollment(sampleCourse.id, wallet);
      if (!enrollment) continue;

      const course = await fetchCourse(sampleCourse.id);
      const lessonsCompleted = bitmapToLessonIndices(enrollment.lessonFlags);
      const totalLessons = course?.lessonCount ?? sampleCourse.lessonCount;
      const completedAtRaw = enrollment.completedAt;
      const completedAt = completedAtRaw
        ? new Date(
            (typeof completedAtRaw === "object" && "toNumber" in (completedAtRaw as any)
              ? (completedAtRaw as any).toNumber()
              : Number(completedAtRaw)) * 1000
          ).toISOString()
        : undefined;
      const enrolledAt = new Date(
        (typeof enrollment.enrolledAt === "object" && "toNumber" in (enrollment.enrolledAt as any)
          ? (enrollment.enrolledAt as any).toNumber()
          : Number(enrollment.enrolledAt)) * 1000
      ).toISOString();

      results.push({
        courseId: sampleCourse.id,
        enrolledAt,
        completedAt,
        lessonsCompleted,
        totalLessons,
        percentComplete: totalLessons > 0 ? (lessonsCompleted.length / totalLessons) * 100 : 0,
        lessonTxHashes: {},
        enrollTxHash: undefined,
        completionTxHash: undefined,
      });
    }
    if (results.length > 0) return NextResponse.json(results);
  } catch {
    // fallback to MongoDB
  }

  await connectDB();
  const enrollments = await Enrollment.find({ userId }).lean();

  return NextResponse.json(
    enrollments.map((e) => ({
      courseId: e.courseId,
      enrolledAt: e.enrolledAt.toISOString(),
      completedAt: e.completedAt?.toISOString() ?? undefined,
      lessonsCompleted: e.lessonsCompleted,
      totalLessons: e.totalLessons,
      percentComplete: e.percentComplete,
      lessonTxHashes: Object.fromEntries((e as any).lessonTxHashes ?? new Map()),
      enrollTxHash: (e as any).enrollTxHash ?? undefined,
      completionTxHash: (e as any).completionTxHash ?? undefined,
    }))
  );
}
