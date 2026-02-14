import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json(null);

  await connectDB();
  const enrollment = await Enrollment.findOne({ userId, courseId }).lean();
  if (!enrollment) return NextResponse.json(null);

  return NextResponse.json({
    courseId: enrollment.courseId,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString() ?? undefined,
    lessonsCompleted: enrollment.lessonsCompleted,
    totalLessons: enrollment.totalLessons,
    percentComplete: enrollment.percentComplete,
  });
}
