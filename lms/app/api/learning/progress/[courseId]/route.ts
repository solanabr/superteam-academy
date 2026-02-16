import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { findEnrollment } from "@/lib/db/helpers";
import { fetchEnrollment, fetchCourse, bitmapToLessonIndices } from "@/lib/solana/readers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);

  // Try on-chain first
  try {
    const wallet = new PublicKey(userId);
    const enrollment = await fetchEnrollment(courseId, wallet);
    if (enrollment) {
      const course = await fetchCourse(courseId);
      const lessonsCompleted = bitmapToLessonIndices(enrollment.lessonFlags);
      const totalLessons = course?.lessonCount ?? lessonsCompleted.length;
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

      return NextResponse.json({
        courseId,
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
  } catch {
    // fallback to MongoDB
  }

  const enrollment = await findEnrollment(userId, courseId);
  if (!enrollment) return NextResponse.json(null);

  return NextResponse.json({
    courseId: enrollment.courseId,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString() ?? undefined,
    lessonsCompleted: enrollment.lessonsCompleted,
    totalLessons: enrollment.totalLessons,
    percentComplete: enrollment.percentComplete,
    lessonTxHashes: Object.fromEntries(enrollment.lessonTxHashes ?? new Map()),
    enrollTxHash: enrollment.enrollTxHash ?? undefined,
    completionTxHash: enrollment.completionTxHash ?? undefined,
  });
}
