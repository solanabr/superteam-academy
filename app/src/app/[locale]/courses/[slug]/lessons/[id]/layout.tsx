import type { Metadata } from "next";
import { fetchCourses } from "@/lib/services/courses";
import { locales } from "@/i18n/config";

export async function generateStaticParams() {
  const courses = await fetchCourses();
  return courses.flatMap((course) =>
    course.modules.flatMap((mod) =>
      mod.lessons.flatMap((lesson) =>
        locales.map((locale) => ({
          locale,
          slug: course.slug,
          id: lesson.id,
        })),
      ),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const courses = await fetchCourses();
  const course = courses.find((c) => c.slug === slug);
  const lesson = course?.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === id);

  return {
    title: lesson ? `${lesson.title} — ${course!.title}` : "Lesson",
  };
}

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
