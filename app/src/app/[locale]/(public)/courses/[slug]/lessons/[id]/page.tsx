import { getCourseBySlug } from "@/lib/sanity";
import { getMockCourseBySlug } from "@/lib/mock-courses";
import { notFound } from "next/navigation";
import type { SanityLesson } from "@/types";
import { LessonView } from "./LessonView";

interface Props {
  params: Promise<{ locale: string; slug: string; id: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { slug, id } = await params;

  let course = await getCourseBySlug(slug).catch(() => null);
  // If Sanity returned a course but doesn't have the requested lesson, fall back to mock
  if (course) {
    const hasLesson = course.modules
      .flatMap((m) => m.lessons ?? [])
      .some((l) => l._id === id);
    if (!hasLesson) course = null;
  }
  if (!course) course = getMockCourseBySlug(slug);
  if (!course) notFound();

  // Flatten all lessons in order
  const allLessons: SanityLesson[] = course.modules.flatMap(
    (m) => m.lessons ?? [],
  );
  const lessonIndex = allLessons.findIndex((l) => l._id === id);
  if (lessonIndex === -1) notFound();

  const lesson = allLessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? allLessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < allLessons.length - 1 ? allLessons[lessonIndex + 1] : null;

  return (
    <LessonView
      lesson={lesson}
      courseSlug={slug}
      onChainCourseId={course.onChainCourseId ?? slug}
      lessonIndex={lessonIndex}
      courseTitle={course.title}
      modules={course.modules}
      prevLessonId={prevLesson?._id ?? null}
      nextLessonId={nextLesson?._id ?? null}
    />
  );
}
