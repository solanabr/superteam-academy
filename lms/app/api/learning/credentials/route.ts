import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchEnrollment, bitmapToLessonIndices } from "@/lib/solana/readers";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json([]);

  // Try on-chain first
  try {
    const walletPk = new PublicKey(wallet);
    const trackMap = new Map<number, { count: number; xp: number; first: string; last: string }>();

    for (const course of SAMPLE_COURSES) {
      const enrollment = await fetchEnrollment(course.id, walletPk);
      if (!enrollment || !enrollment.completedAt) continue;

      const completedAtRaw = enrollment.completedAt;
      const completedAt = new Date(
        (typeof completedAtRaw === "object" && "toNumber" in (completedAtRaw as any)
          ? (completedAtRaw as any).toNumber()
          : Number(completedAtRaw)) * 1000
      ).toISOString();

      const existing = trackMap.get(course.trackId);
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

    if (trackMap.size > 0) {
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
  } catch {
    // fallback to MongoDB
  }

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
    const completedAt = e.completedAt!.toISOString();
    const existing = trackMap.get(course.trackId);
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
