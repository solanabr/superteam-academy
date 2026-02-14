import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

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
    }))
  );
}
