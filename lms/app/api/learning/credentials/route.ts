import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json([]);

  await connectDB();
  const completed = await Enrollment.find({
    userId: wallet,
    completedAt: { $ne: null },
  }).lean();

  if (completed.length === 0) return NextResponse.json([]);

  const trackMap = new Map<number, { count: number; xp: number; first: string; last: string }>();

  for (const e of completed) {
    const course = SAMPLE_COURSES.find((c) => c.id === e.courseId);
    if (!course) continue;
    const existing = trackMap.get(course.trackId);
    const completedAt = e.completedAt!.toISOString();
    if (existing) {
      existing.count++;
      existing.xp += course.xpTotal;
      if (completedAt < existing.first) existing.first = completedAt;
      if (completedAt > existing.last) existing.last = completedAt;
    } else {
      trackMap.set(course.trackId, {
        count: 1,
        xp: course.xpTotal,
        first: completedAt,
        last: completedAt,
      });
    }
  }

  const credentials = [];
  for (const [trackId, data] of trackMap) {
    credentials.push({
      learner: wallet,
      trackId,
      currentLevel: data.count >= 3 ? 3 : data.count >= 2 ? 2 : 1,
      coursesCompleted: data.count,
      totalXpEarned: data.xp,
      firstEarned: data.first,
      lastUpdated: data.last,
      metadataHash: "",
    });
  }

  return NextResponse.json(credentials);
}
