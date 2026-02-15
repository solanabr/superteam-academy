import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Certificate } from "@/lib/db/models/certificate";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> }
) {
  const { trackId } = await params;
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json([]);

  const trackIdNum = parseInt(trackId);
  await connectDB();

  // Backfill: create certificates for completed enrollments in this track
  const trackCourses = SAMPLE_COURSES.filter((c) => c.trackId === trackIdNum);
  for (const course of trackCourses) {
    const enrollment = await Enrollment.findOne({
      userId: wallet,
      courseId: course.id,
      completedAt: { $ne: null },
    }).lean();
    if (enrollment) {
      const existing = await Certificate.findOne({
        wallet,
        courseId: course.id,
      });
      if (!existing) {
        await Certificate.create({
          wallet,
          courseId: course.id,
          courseTitle: course.title,
          trackId: course.trackId,
          xpEarned: course.xpTotal,
          txHash: null,
          issuedAt: enrollment.completedAt,
        });
      }
    }
  }

  const certs = await Certificate.find({
    wallet,
    trackId: trackIdNum,
  })
    .sort({ issuedAt: -1 })
    .lean();

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
