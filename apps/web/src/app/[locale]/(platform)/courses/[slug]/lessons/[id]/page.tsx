import { notFound } from "next/navigation";
import { LessonPageClient } from "./lesson-client";
import {
  getLessonBySlug,
  getCourseLessons,
  getCourseIdBySlug,
} from "@/lib/sanity/queries";

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

  return (
    <LessonPageClient
      lesson={lesson}
      allLessons={allLessons ?? []}
      locale={locale}
      courseSlug={slug}
      courseId={courseInfo?._id ?? slug}
      courseXpPerLesson={courseInfo?.xpPerLesson ?? 0}
    />
  );
}
