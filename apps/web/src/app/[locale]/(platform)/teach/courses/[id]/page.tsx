import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { getTeacherCourseEditable } from "@/lib/sanity/teacher-mutations";
import { getCourseLessonList } from "@/lib/sanity/teacher-structure";
import { getCourseStats } from "@/lib/teacher/stats";
import { getCourseAnalytics } from "@/lib/teacher/analytics";

export const dynamic = "force-dynamic";

function statusKey(s: string | null): "statusDraft" | "statusPendingReview" | "statusApproved" {
  return s === "pending_review"
    ? "statusPendingReview"
    : s === "approved"
      ? "statusApproved"
      : "statusDraft";
}

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const auth = await authorizeTeacher();
  if (!auth.ok) redirect(`/${locale}`);

  const course = await getTeacherCourseEditable(id);
  if (!course) notFound();
  if (auth.caller.role !== "admin" && course.author !== auth.caller.userId) {
    redirect(`/${locale}/teach/courses`);
  }

  const stats = await getCourseStats(id);
  const lessons = await getCourseLessonList(id);
  const analytics = await getCourseAnalytics(
    id,
    lessons,
    course.xpPerLesson ?? 0,
    stats.enrolledCount,
    stats.completionCount
  );

  const t = await getTranslations("teacher.overview");
  const tc = await getTranslations("teacher.courses");

  const cards = [
    { label: t("enrolled"), value: stats.enrolledCount },
    { label: t("completions"), value: stats.completionCount },
    { label: t("certificates"), value: stats.certificateCount },
  ];
  const maxFunnel = Math.max(1, ...analytics.funnel.map((f) => f.completedBy));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/${locale}/teach/courses`}
        className="text-sm text-text-3 underline hover:no-underline"
      >
        &larr; {t("back")}
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            {course.title ?? tc("untitled")}
          </h1>
          <p className="text-xs text-text-3">{tc(statusKey(course.authoringStatus))}</p>
        </div>
        <Link
          href={`/${locale}/teach/courses/${id}/edit`}
          className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("edit")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-card p-5 shadow-card"
          >
            <p className="text-3xl font-bold text-text">{c.value}</p>
            <p className="mt-1 text-sm text-text-3">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: t("completionRate"),
            value: `${Math.round(analytics.completionRate * 100)}%`,
          },
          { label: t("xpAwarded"), value: analytics.xpAwarded },
          {
            label: t("recentActivity", { days: analytics.recentWindowDays }),
            value: `+${analytics.recentEnrollments} / +${analytics.recentCompletions}`,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-lg border border-border bg-card p-4 text-sm shadow-card"
          >
            <p className="text-lg font-bold text-text">{c.value}</p>
            <p className="mt-1 text-text-3">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Per-lesson completion funnel */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-bold text-text">
          {t("lessonFunnel")}
        </h2>
        {analytics.funnel.length === 0 ? (
          <p className="text-sm text-text-3">{t("noLessons")}</p>
        ) : (
          <ol className="space-y-2">
            {analytics.funnel.map((f, i) => (
              <li key={f.lessonId} className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-text">
                    {i + 1}. {f.title || t("untitledLesson")}
                  </span>
                  <span className="shrink-0 text-text-3">{f.completedBy}</span>
                </div>
                <div className="h-1.5 w-full rounded bg-[var(--input)]">
                  <div
                    className="h-1.5 rounded bg-primary"
                    style={{
                      width: `${Math.round((f.completedBy / maxFunnel) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
