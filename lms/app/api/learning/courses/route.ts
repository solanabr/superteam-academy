import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourses } from "@/lib/services/sanity-courses";

export async function GET() {
  await connectDB();

  const sanityCourses = await fetchSanityCourses();
  const courses = sanityCourses.length > 0 ? sanityCourses : SAMPLE_COURSES;

  const stats = await Enrollment.aggregate([
    {
      $group: {
        _id: "$courseId",
        enrolled: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $ne: ["$completedAt", null] }, 1, 0] },
        },
      },
    },
  ]);

  const statsMap = new Map(stats.map((s) => [s._id, s]));

  const result = courses.map((c) => {
    const s = statsMap.get(c.id);
    return {
      ...c,
      totalEnrollments: s?.enrolled ?? 0,
      totalCompletions: s?.completed ?? 0,
    };
  });

  return NextResponse.json(result);
}
