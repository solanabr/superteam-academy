import { getCourseBySlug } from "@/lib/sanity";
import { notFound } from "next/navigation";
import type { SanityLesson } from "@/types";
import { LessonView } from "./LessonView";

interface Props {
  params: Promise<{ locale: string; slug: string; id: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { slug, id } = await params;

  const course = await getCourseBySlug(slug).catch(() => null);
  if (!course) notFound();

  // Flatten all lessons in order
  const allLessons: SanityLesson[] = course.modules.flatMap((m) => m.lessons ?? []);
  const lessonIndex = allLessons.findIndex((l) => l._id === id);
  if (lessonIndex === -1) notFound();

  const lesson = allLessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  return (
    <LessonView
      lesson={lesson}
      courseSlug={slug}
      courseTitle={course.title}
      prevLessonId={prevLesson?._id ?? null}
      nextLessonId={nextLesson?._id ?? null}
    />
  );
}
