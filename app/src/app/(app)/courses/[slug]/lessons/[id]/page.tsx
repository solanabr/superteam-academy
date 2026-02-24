import type { Metadata } from "next";
import { getCourseBySlug } from "@/lib/data-service";
import LessonPageClient from "@/components/course/lesson-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return { title: "Lesson Not Found" };
  }

  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === id);
    if (lesson) {
      return {
        title: `${lesson.title} — ${course.title}`,
        description:
          lesson.description ||
          `Lesson in ${course.title} on Superteam Academy.`,
      };
    }
  }

  return { title: course.title };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  return <LessonPageClient slug={slug} lessonId={id} />;
}
