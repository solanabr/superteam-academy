import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Certificate } from "@/lib/db/models/certificate";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json([]);

  await connectDB();

  // Backfill: create certificates for completed enrollments that don't have one yet
  const completedEnrollments = await Enrollment.find({
    userId: wallet,
    completedAt: { $ne: null },
  }).lean();

  for (const enrollment of completedEnrollments) {
    const existing = await Certificate.findOne({
      wallet,
      courseId: enrollment.courseId,
    });
    if (!existing) {
      const course = SAMPLE_COURSES.find(
        (c) => c.id === enrollment.courseId || c.slug === enrollment.courseId
      );
      if (course) {
        await Certificate.create({
          wallet,
          courseId: enrollment.courseId,
          courseTitle: course.title,
          trackId: course.trackId,
          xpEarned: course.xpTotal,
          txHash: null,
          issuedAt: enrollment.completedAt,
        });
      }
    }
  }

  const certs = await Certificate.find({ wallet }).sort({ issuedAt: -1 }).lean();

  return NextResponse.json(
    certs.map((c) => ({
      wallet: c.wallet,
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      trackId: c.trackId,
      xpEarned: c.xpEarned,
      txHash: c.txHash ?? null,
      issuedAt: c.issuedAt.toISOString(),
    }))
  );
}
