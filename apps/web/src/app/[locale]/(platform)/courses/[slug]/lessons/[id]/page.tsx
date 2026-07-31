import { notFound } from "next/navigation";
import {
  getLessonBySlug,
  getCourseLessons,
  getCourseIdBySlug,
  getLessonSkills,
} from "@/lib/content/queries";
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

  const skills = await getLessonSkills(lesson._id);

  return (
    <LessonPageClient
      lesson={lesson}
      skills={skills}
      allLessons={(allLessons ?? []).filter(Boolean)}
      locale={locale}
      courseSlug={slug}
      courseId={courseInfo?._id ?? slug}
      courseXpPerLesson={courseInfo?.xpPerLesson ?? 0}
    />
  );
}
