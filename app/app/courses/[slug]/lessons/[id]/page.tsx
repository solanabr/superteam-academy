import { notFound } from "next/navigation";
import { courseService } from "@/lib/services";
import { LessonClient } from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const lesson = await courseService.getLesson(slug, id);

  if (!lesson) {
    notFound();
  }

  const allLessons = await courseService.getLessons(slug);
  const lessonsWithMeta = allLessons.map((l, idx) => ({ ...l, lessonNumber: idx + 1 }));
  
  const currentIndex = allLessons.findIndex((l) => l.id === id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : undefined;

  return (
    <LessonClient
      lesson={lesson}
      courseSlug={slug}
      allLessons={lessonsWithMeta}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
    />
  );
}
