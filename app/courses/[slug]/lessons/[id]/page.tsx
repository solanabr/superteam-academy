import { notFound } from 'next/navigation';
import { LessonWorkspace } from '@/components/lesson/lesson-workspace';
import { getPublishedCourseBySlug } from '@/lib/data/courses';

export default async function LessonPage({
  params
}: {
  params: { slug: string; id: string };
}): Promise<JSX.Element> {
  const course = await getPublishedCourseBySlug(params.slug);

  if (!course) {
    notFound();
  }

  const lesson = course.modules.flatMap((moduleItem) => moduleItem.lessons).find((item) => item.id === params.id);

  if (!lesson) {
    notFound();
  }

  const lessons = course.modules.flatMap((moduleItem) => moduleItem.lessons);
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <LessonWorkspace
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      lesson={lesson}
      lessonIndex={currentIndex}
      previousLessonId={previousLesson?.id ?? null}
      nextLessonId={nextLesson?.id ?? null}
    />
  );
}
