import { NextResponse } from "next/server";
import { getContentService } from "@/services/ContentService";

export const dynamic = "force-dynamic";

function inferDifficulty(courseId: string): number {
  if (courseId.includes("fundamentals")) return 1;
  if (courseId.includes("anchor")) return 2;
  if (courseId.includes("defi")) return 3;
  return 2;
}

function inferXpPerLesson(courseId: string): number {
  if (courseId.includes("fundamentals")) return 100;
  if (courseId.includes("anchor")) return 120;
  if (courseId.includes("defi")) return 150;
  return 100;
}

export async function GET() {
  const service = getContentService();
  const courses = await service.getCourses();

  const items = await Promise.all(
    courses.map(async (c, idx) => ({
      courseId: c.courseId,
      lessonCount: await service.getLessonCount(c.courseId),
      difficulty: inferDifficulty(c.courseId),
      xpPerLesson: inferXpPerLesson(c.courseId),
      trackId: idx + 1,
      trackLevel: 1,
      creatorRewardXp: 0,
      minCompletionsForReward: 0,
      totalCompletions: 0,
      totalEnrollments: 0,
      isActive: true,
    })),
  );

  return NextResponse.json({
    source: "content-service",
    courses: items,
  });
}

