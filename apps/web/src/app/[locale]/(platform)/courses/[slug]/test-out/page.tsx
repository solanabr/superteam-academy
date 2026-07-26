import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCourseBySlug } from "@/lib/content/queries";
import { createClient } from "@/lib/supabase/server";
import {
  gatherCourseQuizQuestions,
  MIN_TEST_OUT_POOL,
} from "@/lib/courses/test-out";
import { isCourseTestOutEligible } from "@/lib/courses/path-order";
import { TestOutChallenge } from "@/components/courses/test-out-challenge";

interface TestOutPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * /courses/[slug]/test-out — the segment-2 test-out surface (LX-A5). Server-
 * resolved: the course, its eligibility, and its quiz pool come from the
 * server-only content bundle. `getCourseBySlug` already gates on synced+active,
 * and {@link isCourseTestOutEligible} additionally scopes to structured
 * learning-path courses (the same server-side gate the API enforces); a course
 * that is out of scope or below the {@link MIN_TEST_OUT_POOL} floor renders a
 * localized "unavailable" panel instead of the challenge. Auth is checked here
 * for a clean sign-in prompt; the API enforces it independently.
 */
export default async function TestOutPage({ params }: TestOutPageProps) {
  const { locale, slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const t = await getTranslations("testOut");
  const available =
    (await isCourseTestOutEligible(course._id)) &&
    gatherCourseQuizQuestions(course).length >= MIN_TEST_OUT_POOL;

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

      {!available ? (
        <div className="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-black">
            {t("unavailableTitle")}
          </h2>
          <p className="text-sm text-text-3">{t("unavailableBody")}</p>
        </div>
      ) : user ? (
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
