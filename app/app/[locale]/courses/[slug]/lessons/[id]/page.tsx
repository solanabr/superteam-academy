import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCourseBySlug,
  getLessonBySlugFromCourse,
  getTrackById,
} from "@/lib/data/queries";
import { LessonView } from "@/components/lessons/lesson-view";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};
  const ctx = getLessonBySlugFromCourse(course, id);
  if (!ctx) return {};
  return {
    title: `${ctx.lesson.title} | ${course.title} | Superteam Academy`,
    description: ctx.lesson.title,
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, id } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const ctx = getLessonBySlugFromCourse(course, id);
  if (!ctx) notFound();

  const track = getTrackById(course.trackId);

  return (
    <main className="flex h-[calc(100dvh-64px)] w-full flex-col overflow-hidden">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="shrink-0 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground sm:px-6"
      >
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <li>
            <Link href="/" className="hover:text-foreground hover:underline">
              Catalog
            </Link>
          </li>
          <li aria-hidden className="opacity-60">
            /
          </li>
          <li>
            <Link
              href={`/courses?track=${course.trackId}`}
              className="hover:text-foreground hover:underline"
            >
              {track?.name ?? "Track"}
            </Link>
          </li>
          <li aria-hidden className="opacity-60">
            /
          </li>
          <li>
            <Link
              href={`/courses/${slug}`}
              className="hover:text-foreground hover:underline"
            >
              {course.title}
            </Link>
          </li>
          <li aria-hidden className="opacity-60">
            /
          </li>
          <li className="max-w-[200px] truncate font-medium text-foreground sm:max-w-[320px]">
            {ctx.lesson.title}
          </li>
        </ol>
      </nav>

      {/* Lesson content — takes remaining height */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <LessonView course={course} lessonContext={ctx} />
      </div>
    </main>
  );
}
