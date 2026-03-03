"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useAdminAnalytics } from "@/lib/hooks/use-admin-analytics";
import { AnalyticsOverview } from "./analytics-overview";
import { UserGrowthChart } from "./user-growth-chart";
import { EngagementChart } from "./engagement-chart";
import { EnrollmentFunnel } from "./enrollment-funnel";
import { RetentionGrid } from "./retention-grid";

const RANGES = ["7d", "30d", "90d", "all"] as const;

export function AdminAnalyticsPage() {
  const t = useTranslations("admin.analytics");
  const { data, isLoading, error, range, setRange } = useAdminAnalytics();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToAdmin")}
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-st-green/10">
              <BarChart3 className="h-5 w-5 text-st-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  range === r
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`range.${r}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Content */}
      {data && !isLoading && (
        <div className="space-y-8">
          <AnalyticsOverview
            summary={data.summary}
            activeUsers={data.activeUsers}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <UserGrowthChart data={data.userGrowth} />
            <EngagementChart data={data.engagement} />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <EnrollmentFunnel data={data.enrollmentFunnel} />
            <div className="glass rounded-xl p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t("topCourses")}
              </h3>
              <div className="space-y-3">
                {data.topCourses.map((course, i) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <Link
                          href={`/courses/${course.slug}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {course.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {course.enrollments.toLocaleString()}{" "}
                          {t("enrollments")} · {course.completionRate}%{" "}
                          {t("rate")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {data.topCourses.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("noData")}</p>
                )}
              </div>
            </div>
          </div>

          <RetentionGrid data={data.retention} />
        </div>
      )}
    </div>
  );
}
