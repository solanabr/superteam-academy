"use client";

import { useCreatorStats } from "@/hooks/use-creator-stats";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";

export function CreatorStatsCards() {
  const { data, isLoading } = useCreatorStats();
  const t = useTranslations("creator");

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const stats = [
    { label: t("totalCourses"), value: data?.totalCourses ?? 0 },
    { label: t("totalEnrollments"), value: data?.totalEnrollments ?? 0 },
    { label: t("totalCompletions"), value: data?.totalCompletions ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-edge bg-card p-5 backdrop-blur-lg"
        >
          <p className="text-xs text-content-muted">{s.label}</p>
          <p className="mt-1 text-2xl font-bold text-content">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
