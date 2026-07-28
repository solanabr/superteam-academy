import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPreviewBundle, findPreviewCourse } from "@/lib/teach/preview-store";
import {
  requirePreviewPage,
  previewHrefBase,
  parsePrSegment,
} from "@/lib/teach/preview-guard";
import { CourseDetailClient } from "../../../../../courses/[slug]/course-detail-client";
import { PreviewBanner } from "../../../preview-banner";

export const metadata: Metadata = {
  title: "Course preview",
  robots: { index: false, follow: false },
};

// Compiles a PR tarball on miss; never statically rendered.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string; pr: string; slug: string }>;
}

/**
 * A previewed course rendered with the REAL course page component (#831), so
 * the teacher sees exactly the published layout. `hrefBase` keeps navigation
 * inside the preview and `readOnly` makes enrolment inert — the course does not
 * exist on-chain.
 */
export default async function PreviewCoursePage({ params }: Props) {
  const { locale, pr, slug } = await params;
  await requirePreviewPage(locale);

  const prNumber = parsePrSegment(pr);
  if (prNumber === null) notFound();

  const bundle = await getPreviewBundle(prNumber);
  const course = findPreviewCourse(bundle, slug);
  if (!course) notFound();

  return (
    <>
      <PreviewBanner head={bundle.head} prNumber={prNumber} locale={locale} />
      <CourseDetailClient
        course={course}
        instructorProfile={null}
        changelog={[]}
        hrefBase={previewHrefBase(locale, prNumber)}
        readOnly
      />
    </>
  );
}
