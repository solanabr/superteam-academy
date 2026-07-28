import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPreviewBundle,
  findPreviewCourse,
  findPreviewLesson,
} from "@/lib/teach/preview-store";
import {
  requirePreviewPage,
  previewHrefBase,
  parsePrSegment,
} from "@/lib/teach/preview-guard";
import { LessonPageClient } from "../../../../../../../courses/[slug]/lessons/[id]/lesson-client";

export const metadata: Metadata = {
  title: "Lesson preview",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string; pr: string; slug: string; id: string }>;
}

/**
 * A previewed lesson rendered with the REAL lesson page component (#831):
 * prose, quizzes and the Monaco challenge IDE behave exactly as published.
 * `readOnly` keeps every write path inert — the lesson is not in the live
 * bundle, so completing it would POST an unknown id.
 */
export default async function PreviewLessonPage({ params }: Props) {
  const { locale, pr, slug, id } = await params;
  await requirePreviewPage(locale);

  const prNumber = parsePrSegment(pr);
  if (prNumber === null) notFound();

  const bundle = await getPreviewBundle(prNumber);
  const course = findPreviewCourse(bundle, slug);
  if (!course) notFound();

  const lesson = findPreviewLesson(bundle, course, id);
  if (!lesson) notFound();

  const allLessons = (bundle.lessonsByCourse[course._id] ?? []).map((l) => ({
    _id: l._id,
    title: l.title,
    slug: l.slug,
  }));

  return (
    <LessonPageClient
      lesson={lesson}
      allLessons={allLessons}
      locale={locale}
      courseSlug={course.slug}
      courseId={course._id}
      courseXpPerLesson={bundle.xpPerLessonById[course._id] ?? 0}
      hrefBase={previewHrefBase(locale, prNumber)}
      readOnly
    />
  );
}
