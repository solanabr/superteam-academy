"use client";

import { useMemo } from "react";

type ActivityDay = { date: string; intensity: number };

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
  for (const day of activityDays) {
    intensityByDate.set(day.date, day.intensity);
  }

  if (activityDays.length === 0) {
    return {
      weeks: [] as Date[][],
      intensityByDate,
      activeDays: 0,
      maxStreak: 0,
    };
  }

  const activeDays = activityDays.filter((d) => d.intensity > 0).length;
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

  return { weeks, intensityByDate, activeDays, maxStreak };
}

export function ActivityHeatmap({
  activityDays = [],
  totalSubmissions,
}: {
  activityDays?: ActivityDay[];
  totalSubmissions?: number;
}) {
  const heatmap = useMemo(() => buildHeatmap(activityDays), [activityDays]);

  const submissionCount =
    totalSubmissions ?? activityDays.filter((d) => d.intensity > 0).length;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {/* Header row with stats */}
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-base font-bold text-foreground">
            {submissionCount}
          </span>{" "}
          submissions in the past one year
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
          <span>
            Total active days:{" "}
            <span className="font-medium text-foreground">
              {heatmap.activeDays}
            </span>
          </span>
          <span>
            Max streak:{" "}
            <span className="font-medium text-foreground">
              {heatmap.maxStreak}
            </span>
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[660px]">
          <div className="flex gap-[3px]">
            {heatmap.weeks.map((week) => (
              <div
                key={week[0].toISOString()}
                className="grid grid-rows-7 gap-[3px]"
              >
                {week.map((date) => {
                  const dateKey = toDateKey(date);
                  const intensity = heatmap.intensityByDate.get(dateKey) ?? 0;
                  return (
                    <div
                      key={dateKey}
                      className={`h-[11px] w-[11px] rounded-[2px] ${intensityClass(intensity)}`}
                      title={`${dateKey}: ${
                        intensity > 0
                          ? `${intensity} ${intensity === 1 ? "activity" : "activities"}`
                          : "No activity"
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Month labels at bottom */}
          <div className="flex gap-[3px] mt-1.5">
            {heatmap.weeks.map((week, weekIndex) => {
              const showLabel =
                weekIndex === 0 ||
                week[0].getMonth() !==
                  heatmap.weeks[weekIndex - 1][0].getMonth();

              return (
                <div
                  key={week[0].toISOString()}
                  className="w-[11px] text-[10px] text-muted-foreground leading-none"
                >
                  {showLabel
                    ? week[0].toLocaleString("en-US", { month: "short" })
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
