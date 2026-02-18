"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

type ActivityDay = { date: string; intensity: number; count?: number };

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function intensityClass(intensity: number): string {
  if (intensity <= 0) return "bg-secondary";
  if (intensity === 1) return "bg-emerald-900/60";
  if (intensity === 2) return "bg-emerald-600/70";
  if (intensity === 3) return "bg-emerald-500";
  return "bg-emerald-400";
}

function computeMaxStreak(activityDays: ActivityDay[]): number {
  let max = 0;
  let current = 0;
  for (const day of activityDays) {
    if (day.intensity > 0) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function buildHeatmap(activityDays: ActivityDay[]) {
  const intensityByDate = new Map<string, number>();
  const countByDate = new Map<string, number>();
  for (const day of activityDays) {
    intensityByDate.set(day.date, day.intensity);
    countByDate.set(day.date, day.count ?? (day.intensity > 0 ? 1 : 0));
  }

  if (activityDays.length === 0) {
    return {
      weeks: [] as Date[][],
      intensityByDate,
      countByDate,
      activeDays: 0,
      totalCount: 0,
      maxStreak: 0,
    };
  }

  const activeDays = activityDays.filter((d) => d.intensity > 0).length;
  const totalCount = activityDays.reduce(
    (sum, d) => sum + (d.count ?? (d.intensity > 0 ? 1 : 0)),
    0,
  );
  const maxStreak = computeMaxStreak(activityDays);

  const earliestDate = fromDateKey(activityDays[0].date);
  const latestDate = fromDateKey(activityDays[activityDays.length - 1].date);

  const gridStart = new Date(earliestDate);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(latestDate);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const days: Date[] = [];
  for (
    const cursor = new Date(gridStart);
    cursor <= gridEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    days.push(new Date(cursor));
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return {
    weeks,
    intensityByDate,
    countByDate,
    activeDays,
    totalCount,
    maxStreak,
  };
}

export function ActivityHeatmap({
  activityDays = [],
  totalSubmissions,
}: {
  activityDays?: ActivityDay[];
  totalSubmissions?: number;
}) {
  const t = useTranslations("dashboard");
  const heatmap = useMemo(() => buildHeatmap(activityDays), [activityDays]);

  const submissionCount = totalSubmissions ?? heatmap.totalCount;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header row with stats */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-base font-bold text-foreground">
            {submissionCount}
          </span>{" "}
          {t("submissionsYear", { count: submissionCount }).replace(
            /^\d+\s*/,
            "",
          )}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          <span>
            {t("totalActiveDays")}:{" "}
            <span className="font-medium text-foreground">
              {heatmap.activeDays}
            </span>
          </span>
          <span>
            {t("maxStreak")}:{" "}
            <span className="font-medium text-foreground">
              {heatmap.maxStreak}
            </span>
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div>
        <div>
          <div
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateRows: "repeat(7, 1fr)" }}
          >
            {heatmap.weeks.flatMap((week) =>
              week.map((date) => {
                const dateKey = toDateKey(date);
                const intensity = heatmap.intensityByDate.get(dateKey) ?? 0;
                const count = heatmap.countByDate.get(dateKey) ?? 0;
                return (
                  <div
                    key={dateKey}
                    className={`aspect-square w-full rounded-[2px] ${intensityClass(intensity)}`}
                    title={`${dateKey}: ${
                      count > 0
                        ? `${count} ${count === 1 ? t("activity") : t("activities")}`
                        : t("noActivityTooltip")
                    }`}
                  />
                );
              }),
            )}
          </div>

          {/* Month labels at bottom */}
          <div
            className="grid grid-flow-col mt-1.5 gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${heatmap.weeks.length}, 1fr)`,
            }}
          >
            {heatmap.weeks.map((week, weekIndex) => {
              const showLabel =
                weekIndex === 0 ||
                week[0].getMonth() !==
                  heatmap.weeks[weekIndex - 1][0].getMonth();

              return (
                <div
                  key={week[0].toISOString()}
                  className="text-[10px] text-muted-foreground leading-none overflow-visible whitespace-nowrap"
                >
                  {showLabel
                    ? week[0].toLocaleString(undefined, { month: "short" })
                    : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
