"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useActivityStore } from "@/stores/activity-store";
import { cn } from "@/lib/utils";

const WEEKS = 12;
const DAYS = WEEKS * 7; // 84 days

// Map activity count to Tailwind color class (GitHub-style green shades)
function getActivityColor(count: number): string {
  if (count === 0) return "bg-muted/40 dark:bg-muted/20";
  if (count === 1) return "bg-green-200 dark:bg-green-900";
  if (count === 2) return "bg-green-300 dark:bg-green-700";
  if (count === 3) return "bg-green-400 dark:bg-green-600";
  return "bg-green-500 dark:bg-green-500";
}

// Returns "YYYY-MM-DD" in local timezone
function toLocalDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

// Returns abbreviated month name using the given locale
function getMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "short" });
}

// Generate localized day labels: show Mon, Wed, Fri; empty for the rest
function buildDayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // Generate short names for Sun(0) through Sat(6)
  const names = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i); // 2024-01-07 is a Sunday
    return formatter.format(d);
  });
  // Indices: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return ["", names[1] ?? "", "", names[3] ?? "", "", names[5] ?? "", ""];
}

export function StreakCalendar() {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const { activities } = useActivityStore();

  // Build a map of date string -> activity count
  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const activity of activities) {
      const dateKey = toLocalDate(new Date(activity.timestamp));
      map[dateKey] = (map[dateKey] ?? 0) + 1;
    }
    return map;
  }, [activities]);

  // Build 84 day slots ending today, memoized to avoid recomputing on every render
  const { today, weeks } = useMemo(() => {
    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);

    const slots: Date[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(t0);
      d.setDate(t0.getDate() - i);
      slots.push(d);
    }

    const w: Date[][] = [];
    for (let wi = 0; wi < WEEKS; wi++) {
      w.push(slots.slice(wi * 7, wi * 7 + 7));
    }

    return { today: t0, weeks: w };
  }, []);

  const dayLabels = useMemo(() => buildDayLabels(locale), [locale]);

  // Month labels: show month name when a new month starts in a week column
  const monthLabels: (string | null)[] = weeks.map((week, wIdx) => {
    const firstDay = week[0];
    if (!firstDay) return null;
    if (wIdx === 0) return getMonthLabel(firstDay, locale);
    const prevWeek = weeks[wIdx - 1];
    const prevLastDay = prevWeek?.[6];
    if (!prevLastDay) return getMonthLabel(firstDay, locale);
    if (firstDay.getMonth() !== prevLastDay.getMonth()) {
      return getMonthLabel(firstDay, locale);
    }
    return null;
  });

  return (
    <div role="img" aria-label={t("calendar.title")} className="w-full overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month labels row */}
        <div className="flex gap-1 pl-9">
          {weeks.map((_, wIdx) => (
            <div key={wIdx} className="w-5 text-[10px] text-muted-foreground leading-none">
              {monthLabels[wIdx] ?? ""}
            </div>
          ))}
        </div>

        {/* Main grid: day-of-week labels + week columns */}
        <div className="flex gap-1">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-1 pr-1">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-5 w-7 text-[10px] text-muted-foreground leading-none flex items-center"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => {
                const dateKey = toLocalDate(day);
                const count = activityMap[dateKey] ?? 0;
                const isFuture = day > today;
                const label = isFuture
                  ? t("calendar.noActivity")
                  : count > 0
                  ? t("calendar.activityOn", { date: dateKey })
                  : t("calendar.noActivity");

                return (
                  <div
                    key={dIdx}
                    title={label}
                    className={cn(
                      "h-5 w-5 rounded-sm transition-colors",
                      isFuture
                        ? "bg-muted/20 dark:bg-muted/10"
                        : getActivityColor(count)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 pt-1 pl-9">
          <span className="text-[10px] text-muted-foreground mr-1">{t("calendar.noActivity")}</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn("h-5 w-5 rounded-sm", getActivityColor(level))}
            />
          ))}
          <span className="text-[10px] text-muted-foreground ml-1">{t("calendar.weeks")}</span>
        </div>
      </div>
    </div>
  );
}
