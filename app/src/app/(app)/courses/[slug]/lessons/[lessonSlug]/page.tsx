import { notFound } from "next/navigation";
import { getLessonBySlug } from "@/lib/cms/sanity";
import type { Lesson } from "@/lib/cms/schemas";
import { LessonClient } from "@/components/lesson/LessonClient";

export const revalidate = 60;

interface LessonWithCourse extends Lesson {
  courseId?: string;
  onChainCourseId?: string;
  course?: {
    _id: string;
    onChainCourseId?: string;
    title: string;
    slug: { current: string };
    modules?: Array<{
      _id: string;
      title: string;
      order: number;
      lessons?: Array<{
        _id: string;
        title: string;
        slug: { current: string };
        order: number;
      }>;
    }>;
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug: courseSlug, lessonSlug } = await params;
  const lesson: LessonWithCourse | null = await getLessonBySlug(courseSlug, lessonSlug);

  if (!lesson) notFound();

  const courseId = lesson.courseId || lesson.course?._id;
  const onChainCourseId = lesson.onChainCourseId || lesson.course?.onChainCourseId;
  const courseModules = lesson.course?.modules;

  return (
    <LessonClient
      lesson={lesson}
      courseSlug={courseSlug}
      courseId={courseId}
      onChainCourseId={onChainCourseId}
      courseModules={courseModules}
    />
  );
}
