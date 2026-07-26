import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCourseBySlug } from "@/lib/content/queries";
import { createClient } from "@/lib/supabase/server";
import { gatherCourseQuizQuestions } from "@/lib/courses/test-out";
import { TestOutChallenge } from "@/components/courses/test-out-challenge";

interface TestOutPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * /courses/[slug]/test-out — the segment-2 test-out surface (LX-A5). Server-
 * resolved: the course and its quiz pool come from the server-only content
 * bundle, so a course with no authored retrieval closes 404s before anything
 * reaches the client. Auth is checked here for a clean sign-in prompt; the API
 * enforces it independently.
 */
export default async function TestOutPage({ params }: TestOutPageProps) {
  const { locale, slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  // A course with no authored quiz pool has no test-out.
  if (gatherCourseQuizQuestions(course).length === 0) notFound();

  const t = await getTranslations("testOut");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-2xl font-black tracking-[-0.5px] sm:text-3xl">
          {t("title", { course: course.title })}
        </h1>
        <p className="text-sm text-text-3">{t("subtitle")}</p>
      </header>

      {user ? (
        <TestOutChallenge courseId={course._id} locale={locale} />
      ) : (
        <div className="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-black">
            {t("signInTitle")}
          </h2>
          <p className="text-sm text-text-3">{t("signInHint")}</p>
        </div>
      )}
    </div>
  );
}
