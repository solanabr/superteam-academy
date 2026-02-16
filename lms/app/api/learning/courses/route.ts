import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Enrollment } from "@/lib/db/models/enrollment";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { fetchSanityCourses } from "@/lib/services/sanity-courses";
import { fetchConfigCached, fetchCourse as fetchOnChainCourse } from "@/lib/solana/readers";

export async function GET() {
  const sanityCourses = await fetchSanityCourses();
  const courses = sanityCourses.length > 0 ? sanityCourses : SAMPLE_COURSES;

  // Check config once (cached) — skip all on-chain fetches if program not deployed
  let useOnChain = false;
  const onChainStats = new Map<string, { enrolled: number; completed: number }>();

  const config = await fetchConfigCached();
  if (config) {
    try {
      const results = await Promise.all(
        courses.map(async (c) => {
          const onChain = await fetchOnChainCourse(c.id);
          return { id: c.id, onChain };
        })
      );
      for (const r of results) {
        if (r.onChain) {
          useOnChain = true;
          onChainStats.set(r.id, {
            enrolled: r.onChain.totalEnrollments ?? 0,
            completed: r.onChain.totalCompletions ?? 0,
          });
        }
      }
    } catch {
      // fallback to MongoDB
    }
  }

  if (!useOnChain) {
    await connectDB();
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
    for (const s of stats) {
      onChainStats.set(s._id, { enrolled: s.enrolled, completed: s.completed });
    }
  }

  const result = courses.map((c) => {
    const s = onChainStats.get(c.id);
    // Strip lesson content and challenge details for listing — only send metadata
    const lightModules = c.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        order: l.order,
        type: l.type,
        xpReward: l.xpReward,
        duration: l.duration,
      })),
    }));
    return {
      ...c,
      modules: lightModules,
      totalEnrollments: s?.enrolled ?? 0,
      totalCompletions: s?.completed ?? 0,
    };
  });

  return NextResponse.json(result);
}
