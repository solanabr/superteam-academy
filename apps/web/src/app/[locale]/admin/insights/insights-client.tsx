"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Robot, ChartBar } from "@phosphor-icons/react";
import type { PlatformInsights } from "@/lib/admin/insights";

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
  rows: (string | number)[][];
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

export function InsightsClient() {
  const t = useTranslations("admin.insightsScreen");

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
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border-[2.5px] border-border bg-card shadow-card">
            <h3 className="border-b border-border px-4 py-2 text-xs font-bold uppercase text-text-3">
              {t("learning.perCourse")}
            </h3>
            <DataTable
              headers={[
                t("learning.course"),
                t("learning.completions"),
                t("learning.learnersCol"),
              ]}
              rows={data.learning.perCourse.map((c) => [
                c.courseId,
                c.completions,
                c.learners,
              ])}
              empty={t("empty")}
            />
          </div>
          <div className="rounded-xl border-[2.5px] border-border bg-card shadow-card">
            <h3 className="border-b border-border px-4 py-2 text-xs font-bold uppercase text-text-3">
              {t("learning.completionsByDay")}
            </h3>
            <DataTable
              headers={[t("learning.day"), t("learning.completions")]}
              rows={data.learning.completionsByDay.map((d) => [d.day, d.count])}
              empty={t("empty")}
            />
          </div>
        </div>
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
          <StatCard
            label={t("ai.spend30d")}
            value={`$${data.ai.spend30dUsd.toFixed(2)}`}
          />
          <StatCard label={t("ai.requests30d")} value={data.ai.requests30d} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border-[2.5px] border-border bg-card shadow-card">
            <h3 className="border-b border-border px-4 py-2 text-xs font-bold uppercase text-text-3">
              {t("ai.topLessons")}
            </h3>
            <DataTable
              headers={[
                t("ai.lesson"),
                t("ai.assistsCol"),
                t("ai.learnersCol"),
              ]}
              rows={data.ai.topLessons.map((l) => [
                l.lessonId,
                l.assists,
                l.learners,
              ])}
              empty={t("empty")}
            />
            <p className="border-t border-border px-4 py-2 text-xs text-text-3">
              {t("ai.topLessonsHint")}
            </p>
          </div>
          <div className="rounded-xl border-[2.5px] border-border bg-card shadow-card">
            <h3 className="border-b border-border px-4 py-2 text-xs font-bold uppercase text-text-3">
              {t("ai.spendByDay")}
            </h3>
            <DataTable
              headers={[t("ai.day"), t("ai.usd"), t("ai.requests")]}
              rows={data.ai.spendByDay.map((s) => [
                s.day,
                `$${s.usd.toFixed(2)}`,
                s.requests,
              ])}
              empty={t("empty")}
            />
          </div>
        </div>
      </section>

      {/* Quiz correctness lives in PostHog, not here — say so rather than
          looking like a missing feature (#836). */}
      <p className="rounded-md border border-border p-3 text-xs text-text-3 [background:var(--input)]">
        {t("quizNote")}
      </p>
    </div>
  );
}
