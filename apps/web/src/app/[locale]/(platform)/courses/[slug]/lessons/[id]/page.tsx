import { notFound } from "next/navigation";
import {
  getLessonBySlug,
  getCourseLessons,
  getCourseIdBySlug,
  getLessonSkills,
} from "@/lib/content/queries";
import { getLessonCompletionCount } from "@/lib/lessons/completion-count";
import { LessonPageClient } from "./lesson-client";

interface LessonPageProps {
  params: Promise<{ locale: string; slug: string; id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, slug, id } = await params;

  const [lesson, allLessons, courseInfo] = await Promise.all([
    getLessonBySlug(slug, id),
    getCourseLessons(slug),
    getCourseIdBySlug(slug),
  ]);

  if (!lesson) notFound();

  // buildersCompleted degrades to 0 on any failure (and 0 when the course is
  // not synced yet) — the chip is enrichment and must never block the render.
  const [skills, buildersCompleted] = await Promise.all([
    getLessonSkills(lesson._id),
    courseInfo
      ? getLessonCompletionCount(courseInfo._id, lesson._id)
      : Promise.resolve(0),
  ]);

  return (
    <LessonPageClient
      lesson={lesson}
      skills={skills}
      allLessons={(allLessons ?? []).filter(Boolean)}
      locale={locale}
      courseSlug={slug}
      courseId={courseInfo?._id ?? slug}
      courseXpPerLesson={courseInfo?.xpPerLesson ?? 0}
      courseDifficulty={courseInfo?.difficulty ?? null}
      buildersCompleted={buildersCompleted}
    />
  );
}
