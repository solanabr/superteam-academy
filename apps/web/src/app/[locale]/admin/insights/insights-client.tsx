"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Robot, ChartBar } from "@phosphor-icons/react";
import type { PlatformInsights } from "@/lib/admin/insights";
import {
  InsightsChart,
  BarCell,
  fillDayWindow,
} from "@/components/admin/insights-chart";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-[2.5px] border-border bg-card p-4 shadow-card">
      <p className="text-xs uppercase text-text-3">{label}</p>
      <p className="mt-1 font-display text-2xl font-black tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="p-4 text-sm text-text-3">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-text-3">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td
                  key={j}
                  className={
                    j === 0
                      ? "px-4 py-2 font-mono text-xs text-text"
                      : "px-4 py-2 tabular-nums text-text-3"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-[2.5px] border-border bg-card shadow-card">
      <h3 className="border-b border-border px-4 py-2 text-xs font-bold uppercase text-text-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

const usd = (v: number): string => `$${v.toFixed(2)}`;

export function InsightsClient() {
  const t = useTranslations("admin.insightsScreen");
  const locale = useLocale();

  const [data, setData] = useState<PlatformInsights | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/insights")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error())))
      .then((body: PlatformInsights) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The RPC path already zero-fills both series in SQL; the JS fallback does
  // not. Padding here makes the charts identical either way (#1135).
  const endDay = data?.generatedAt.slice(0, 10) ?? "";
  const completions = useMemo(
    () =>
      fillDayWindow(data?.learning.completionsByDay ?? [], endDay, (day) => ({
        day,
        count: 0,
      })),
    [data, endDay]
  );
  const spend = useMemo(
    () =>
      fillDayWindow(data?.ai.spendByDay ?? [], endDay, (day) => ({
        day,
        usd: 0,
        requests: 0,
      })),
    [data, endDay]
  );

  if (error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {t("error")}
      </p>
    );
  }
  if (!data) {
    return <p className="text-sm text-text-3">{t("loading")}</p>;
  }

  const maxCourseCompletions = Math.max(
    1,
    ...data.learning.perCourse.map((c) => c.completions)
  );
  const maxLessonAssists = Math.max(
    1,
    ...data.ai.topLessons.map((l) => l.assists)
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-xl font-black text-text">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-text-3">{t("subtitle")}</p>
      </header>

      {/* Learning activity */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-text-3">
          <ChartBar size={16} weight="duotone" aria-hidden="true" />
          {t("learning.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label={t("learning.learners")}
            value={data.learning.totalLearners}
          />
          <StatCard
            label={t("learning.enrollments")}
            value={data.learning.totalEnrollments}
          />
          <StatCard
            label={t("learning.active7d")}
            value={data.learning.activeLearners7d}
          />
          <StatCard
            label={t("learning.active30d")}
            value={data.learning.activeLearners30d}
          />
        </div>
        <p className="text-xs text-text-3">{t("learning.activityHint")}</p>

        <Panel title={t("learning.completionsByDay")}>
          <InsightsChart
            variant="bar"
            data={completions.map((d) => ({ day: d.day, value: d.count }))}
            label={t("learning.completionsChartLabel")}
            dayHeader={t("learning.day")}
            valueHeader={t("learning.completions")}
            locale={locale}
            empty={t("empty")}
          />
        </Panel>

        <Panel title={t("learning.perCourse")}>
          <DataTable
            headers={[
              t("learning.course"),
              t("learning.completions"),
              t("learning.learnersCol"),
            ]}
            rows={data.learning.perCourse.map((c) => [
              c.courseId,
              <BarCell
                key="completions"
                value={c.completions}
                max={maxCourseCompletions}
              />,
              c.learners,
            ])}
            empty={t("empty")}
          />
          <p className="border-t border-border px-4 py-2 text-xs text-text-3">
            {t("learning.perCourseHint")}
          </p>
        </Panel>
      </section>

      {/* AI tutor */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold uppercase text-text-3">
          <Robot size={16} weight="duotone" aria-hidden="true" />
          {t("ai.title")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("ai.learners")} value={data.ai.learnersUsingAi} />
          <StatCard label={t("ai.assists")} value={data.ai.totalAssists} />
          <StatCard label={t("ai.spend30d")} value={usd(data.ai.spend30dUsd)} />
          <StatCard label={t("ai.requests30d")} value={data.ai.requests30d} />
        </div>

        <Panel title={t("ai.spendChart")}>
          {/* Requests ride along in the tooltip and the screen-reader table
              rather than a second axis — a crossing between two independently
              scaled series means nothing. */}
          <InsightsChart
            variant="area"
            data={spend.map((s) => ({ day: s.day, value: s.usd }))}
            label={t("ai.spendChartLabel")}
            dayHeader={t("ai.day")}
            valueHeader={t("ai.usd")}
            locale={locale}
            format={usd}
            secondary={{
              header: t("ai.requests"),
              values: spend.map((s) => s.requests),
            }}
            empty={t("empty")}
          />
        </Panel>

        <Panel title={t("ai.topLessons")}>
          <DataTable
            headers={[t("ai.lesson"), t("ai.assistsCol"), t("ai.learnersCol")]}
            rows={data.ai.topLessons.map((l) => [
              l.lessonId,
              <BarCell
                key="assists"
                value={l.assists}
                max={maxLessonAssists}
              />,
              l.learners,
            ])}
            empty={t("empty")}
          />
          <p className="border-t border-border px-4 py-2 text-xs text-text-3">
            {t("ai.topLessonsHint")}
          </p>
          {/* Quiz correctness lives in PostHog, not here — say so next to the
              lesson data rather than looking like a missing feature (#836). */}
          <p className="border-t border-border px-4 py-2 text-xs text-text-3">
            {t("quizNote")}
          </p>
        </Panel>
      </section>
    </div>
  );
}
