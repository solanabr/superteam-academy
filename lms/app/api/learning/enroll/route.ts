import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { ensureUser } from "@/lib/db/helpers";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourse } from "@/lib/services/sanity-courses";

export async function POST(req: NextRequest) {
  const { userId, courseId } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();
  await ensureUser(userId);

  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) return NextResponse.json({ ok: true });

  const sanityCourse = await fetchSanityCourse(courseId);
  const course = sanityCourse ?? SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId);
  if (!course) return NextResponse.json({ error: "course not found" }, { status: 404 });

  await Enrollment.create({
    userId,
    courseId,
    totalLessons: course.lessonCount,
  });

  return NextResponse.json({ ok: true });
}
