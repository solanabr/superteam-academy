import { notFound } from "next/navigation";
import {
  getLessonBySlug,
  getCourseLessons,
  getCourseIdBySlug,
  getLessonSkills,
} from "@/lib/content/queries";
import { getLessonCompletionCount } from "@/lib/lessons/completion-count";
import { getLessonVideoEmbeds } from "@/lib/video/embeddability";
import { LessonPageClient } from "./lesson-client";

interface LessonPageProps {
  params: Promise<{ locale: string; slug: string; id: string }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { locale, slug, id } = await params;

  const [lesson, allLessons, courseInfo] = await Promise.all([
    getLessonBySlug(slug, id, locale),
    getCourseLessons(slug, locale),
    getCourseIdBySlug(slug),
  ]);

  if (!lesson) notFound();

  // buildersCompleted degrades to 0 on any failure (and 0 when the course is
  // not synced yet) — the chip is enrichment and must never block the render.
  // videoEmbeds: one cached oembed probe per YouTube id (>= 1 day, tagged with
  // the course tag). Never throws and never blocks — an unreachable YouTube
  // resolves to "embeddable", i.e. the player renders exactly as before.
  const [skills, buildersCompleted, videoEmbeds] = await Promise.all([
    getLessonSkills(lesson._id),
    courseInfo
      ? getLessonCompletionCount(courseInfo._id, lesson._id)
      : Promise.resolve(0),
    getLessonVideoEmbeds(lesson.blocks),
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
      courseSourceLocale={courseInfo?.sourceLocale ?? null}
      courseAvailableLocales={courseInfo?.availableLocales ?? null}
      videoEmbeds={videoEmbeds}
    />
  );
}
