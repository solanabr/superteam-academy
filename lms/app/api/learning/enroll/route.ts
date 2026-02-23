import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { ensureUser } from "@/lib/db/helpers";
import { getCourseById } from "@/lib/db/course-helpers";
import { fetchSanityCourse } from "@/lib/services/sanity-courses";

export async function POST(req: NextRequest) {
  const { userId, courseId, txSignature: clientTxSignature } = await req.json();
  if (!userId || !courseId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await connectDB();
  await ensureUser(userId);

  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing) return NextResponse.json({ ok: true, txSignature: null });

  const sanityCourse = await fetchSanityCourse(courseId);
  const course = sanityCourse ?? (await getCourseById(courseId));
  if (!course)
    return NextResponse.json({ error: "course not found" }, { status: 404 });

  // Client must provide on-chain tx signature from buildEnrollTx
  const txSignature: string | null = clientTxSignature ?? null;

  await Enrollment.create({
    userId,
    courseId,
    totalLessons: course.lessonCount,
    enrollTxHash: txSignature ?? undefined,
  });

  return NextResponse.json({ ok: true, txSignature });
}
