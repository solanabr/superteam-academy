import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourse } from "@/lib/services/sanity-courses";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  await connectDB();

  const sanityCourse = await fetchSanityCourse(courseId);
  const course =
    sanityCourse ??
    SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId) ??
    null;

  if (!course) return NextResponse.json(null);

  const stats = await Enrollment.aggregate([
    { $match: { courseId: course.id } },
    {
      $group: {
        _id: null,
        enrolled: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $ne: ["$completedAt", null] }, 1, 0] },
        },
      },
    },
  ]);

  const s = stats[0];
  return NextResponse.json({
    ...course,
    totalEnrollments: s?.enrolled ?? 0,
    totalCompletions: s?.completed ?? 0,
  });
}
