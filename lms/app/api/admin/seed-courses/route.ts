import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { CourseModel } from "@/lib/db/models/course";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchCourse } from "@/lib/solana/readers";
import { getCoursePDA } from "@/lib/solana/pda";

export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await connectDB();
  const results: string[] = [];

  for (const course of SAMPLE_COURSES) {
    let onChainAddress: string | null = null;

    try {
      const onChain = await fetchCourse(course.id);
      if (onChain) {
        const [pda] = getCoursePDA(course.id);
        onChainAddress = pda.toBase58();
      }
    } catch {
      // on-chain unavailable
    }

    const existing = await CourseModel.findOne({ courseId: course.id });
    if (existing) {
      if (onChainAddress && !existing.onChainAddress) {
        existing.onChainAddress = onChainAddress;
        await existing.save();
        results.push(`${course.id}: updated on-chain address`);
      } else {
        results.push(`${course.id}: already exists`);
      }
      continue;
    }

    await CourseModel.create({
      courseId: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      creator: course.creator,
      difficulty: course.difficulty,
      lessonCount: course.lessonCount,
      challengeCount: course.challengeCount,
      xpTotal: course.xpTotal,
      trackId: course.trackId,
      trackLevel: course.trackLevel,
      duration: course.duration,
      prerequisiteId: course.prerequisiteId,
      isActive: course.isActive,
      totalCompletions: 0,
      totalEnrollments: 0,
      modules: course.modules,
      createdAt: course.createdAt,
      onChainAddress,
    });
    results.push(
      `${course.id}: seeded to DB${onChainAddress ? " (on-chain verified)" : ""}`,
    );
  }

  return NextResponse.json({ ok: true, count: SAMPLE_COURSES.length, results });
}
