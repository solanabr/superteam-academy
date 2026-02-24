"use client";

import { useCreatorStats } from "@/hooks/use-creator-stats";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export function CourseAnalytics() {
  const { data, isLoading } = useCreatorStats();
  const t = useTranslations("creator");

  if (isLoading) return <TableSkeleton rows={3} />;

  if (!data?.courses.length) {
    return <p className="py-8 text-center text-sm text-content-muted">{t("noCourses")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-edge">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge text-left text-xs text-content-muted">
            <th className="px-4 py-3">{t("course")}</th>
            <th className="px-4 py-3 text-right">{t("enrollments")}</th>
            <th className="px-4 py-3 text-right">{t("completions")}</th>
            <th className="px-4 py-3 text-right">{t("completionRate")}</th>
          </tr>
        </thead>
        <tbody>
          {data.courses.map((c) => (
            <tr key={c.courseId} className="border-b border-edge-soft hover:bg-card-hover">
              <td className="px-4 py-3 font-medium text-content">{c.courseId}</td>
              <td className="px-4 py-3 text-right text-content-secondary">{c.enrollments}</td>
              <td className="px-4 py-3 text-right text-content-secondary">{c.completions}</td>
              <td className="px-4 py-3 text-right text-content-secondary">
                {c.enrollments > 0
                  ? `${Math.round((c.completions / c.enrollments) * 100)}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
