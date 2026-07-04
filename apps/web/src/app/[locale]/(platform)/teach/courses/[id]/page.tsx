import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { getTeacherCourseEditable } from "@/lib/sanity/teacher-mutations";
import { getCourseStats } from "@/lib/teacher/stats";

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
  const t = await getTranslations("teacher.overview");
  const tc = await getTranslations("teacher.courses");

  const cards = [
    { label: t("enrolled"), value: stats.enrolledCount },
    { label: t("completions"), value: stats.completionCount },
    { label: t("certificates"), value: stats.certificateCount },
  ];

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
    </div>
  );
}
