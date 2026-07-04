import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authorizeTeacher } from "@/lib/teacher/authorize";
import { listTeacherCourses } from "@/lib/sanity/teacher-mutations";

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { locale } = await params;
  const { submitted } = await searchParams;

  // The /teach layout already gates, but we need the caller id here.
  const auth = await authorizeTeacher();
  if (!auth.ok) redirect(`/${locale}`);

  const t = await getTranslations("teacher.courses");
  const tForm = await getTranslations("teacher.form");
  const courses = await listTeacherCourses(auth.caller.userId);

  const statusLabel = (s: string | null): string =>
    s === "pending_review"
      ? t("statusPendingReview")
      : s === "approved"
        ? t("statusApproved")
        : t("statusDraft");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text">
          {t("heading")}
        </h1>
        <Link
          href={`/${locale}/teach/courses/new`}
          className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("new")}
        </Link>
      </div>

      {submitted === "1" && (
        <div className="mb-4 rounded-md border border-success bg-success-light p-3 text-sm text-success">
          {tForm("submitted")}
        </div>
      )}

      {courses.length === 0 ? (
        <p className="text-sm text-text-3">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {courses.map((c) => (
            <li
              key={c._id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-card"
            >
              <div>
                <p className="font-medium text-text">
                  {c.title ?? t("untitled")}
                </p>
                <p className="text-xs text-text-3">
                  {statusLabel(c.authoringStatus)}
                </p>
              </div>
              <Link
                href={`/${locale}/teach/courses/${c._id}`}
                className="text-sm text-primary underline hover:no-underline"
              >
                {t("manage")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
