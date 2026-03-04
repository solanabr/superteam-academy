import { NextResponse } from "next/server";
import { getContentService } from "@/services/ContentService";

export const dynamic = "force-dynamic";

export async function GET() {
  const sanityConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
  const service = getContentService();
  const courses = await service.getCourses();

  const lessonCounts: Record<string, number> = {};
  for (const course of courses) {
    lessonCounts[course.courseId] = await service.getLessonCount(course.courseId);
  }

  return NextResponse.json({
    sanityConfigured,
    contentMode: sanityConfigured ? "sanity-with-fallback" : "local-json",
    courseCount: courses.length,
    lessonCounts,
    note:
      "If Sanity is configured but empty/unavailable, service falls back to local JSON defaults.",
  });
}

