"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { Flame, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";

const WEEKS = 12;
const DAYS = WEEKS * 7; // 84 days

// Returns "YYYY-MM-DD" in local timezone
function toLocalDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

// Returns abbreviated month label using the given locale
function getMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: "short" });
}

// Build day-of-week labels (Mon, Wed, Fri only)
function buildDayLabels(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  // 2024-01-07 is a Sunday, so +1..+6 are Mon..Sat
  const names = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + i);
    return formatter.format(d);
  });
  // indices: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return ["", names[1] ?? "", "", names[3] ?? "", "", names[5] ?? "", ""];
}

// Map activity presence to color classes
function getCellColor(active: boolean, isFuture: boolean, isFreeze: boolean): string {
  if (isFuture) return "bg-muted/15 dark:bg-muted/8";
  if (isFreeze) return "bg-blue-500/40 dark:bg-blue-500/30";
  if (active) return "bg-[#14F195] dark:bg-[#14F195] opacity-90";
  return "bg-muted/40 dark:bg-muted/20";
}

interface MilestoneBadge {
  days: number;
  label: string;
  icon: string;
}

const MILESTONE_BADGES: MilestoneBadge[] = [
  { days: 7, label: "7-day streak", icon: "🔥" },
  { days: 30, label: "30-day streak", icon: "⚡" },
  { days: 100, label: "100-day streak", icon: "💎" },
];

export function ActivityHeatmap() {
  const locale = useLocale();
  const {
    activityDates,
    streakDays,
    streakFreezeUsedDates,
    streakMilestonesReached,
  } = useProgressStore();

  const activitySet = useMemo(() => new Set(activityDates), [activityDates]);
  const freezeSet = useMemo(() => new Set(streakFreezeUsedDates), [streakFreezeUsedDates]);

  // Build 84 day slots ending today
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

  // Month labels — show when month changes across week columns
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

  // Compute stats
  const todayStr = toLocalDate(today);
  const totalActiveDays = activitySet.size;

  // Consistency %: active days / total non-future days in the 84-day window
  const windowStart = weeks[0]?.[0];
  const windowStartStr = windowStart ? toLocalDate(windowStart) : todayStr;
  const nonFutureDaysInWindow = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (DAYS - 1 - i));
    return toLocalDate(d);
  }).filter((ds) => ds <= todayStr && ds >= windowStartStr).length;

  const activeDaysInWindow = activityDates.filter(
    (ds) => ds >= windowStartStr && ds <= todayStr
  ).length;

  const consistencyPct =
    nonFutureDaysInWindow > 0
      ? Math.round((activeDaysInWindow / nonFutureDaysInWindow) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-muted-foreground">Current Streak</span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {streakDays}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </p>
        </div>

        <div className="rounded-xl border border-[#14F195]/20 bg-[#14F195]/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-3.5 w-3.5 text-[#14F195] shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-muted-foreground">Active Days</span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {totalActiveDays}
            <span className="text-xs font-normal text-muted-foreground ml-1">total</span>
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-[11px] font-medium text-muted-foreground">Consistency</span>
          </div>
          <p className="text-xl font-bold tabular-nums">
            {consistencyPct}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">%</span>
          </p>
        </div>
      </div>

      {/* Milestone badges */}
      {streakMilestonesReached.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {MILESTONE_BADGES.filter((b) => streakMilestonesReached.includes(b.days)).map((badge) => (
            <div
              key={badge.days}
              className="flex items-center gap-1.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-3 py-1 text-xs font-semibold text-[#14F195]"
              title={badge.label}
            >
              <span aria-hidden="true">{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>
      )}

      {/* Heatmap grid */}
      <div
        role="img"
        aria-label="Activity heatmap — last 12 weeks"
        className="w-full overflow-x-auto"
      >
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels row */}
          <div className="flex gap-1 pl-9">
            {weeks.map((_, wIdx) => (
              <div
                key={wIdx}
                className="w-5 text-[10px] text-muted-foreground leading-none"
              >
                {monthLabels[wIdx] ?? ""}
              </div>
            ))}
          </div>

          {/* Day-of-week labels + week columns */}
          <div className="flex gap-1">
            {/* Day labels */}
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
                  const isFuture = day > today;
                  const isToday = dateKey === todayStr;
                  const isActive = activitySet.has(dateKey);
                  const isFreeze = freezeSet.has(dateKey);

                  const tooltipLabel = isFuture
                    ? "Future"
                    : isFreeze
                    ? `Streak freeze — ${dateKey}`
                    : isActive
                    ? `Active — ${dateKey}`
                    : `No activity — ${dateKey}`;

                  return (
                    <div
                      key={dIdx}
                      title={tooltipLabel}
                      className={cn(
                        "h-5 w-5 rounded-sm transition-colors",
                        getCellColor(isActive, isFuture, isFreeze),
                        isToday && !isFuture && [
                          "ring-2 ring-offset-1 ring-offset-card",
                          isActive
                            ? "ring-[#14F195]"
                            : "ring-muted-foreground/50",
                        ]
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 pt-1 pl-9 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Less</span>
            <div className="h-4 w-4 rounded-sm bg-muted/40 dark:bg-muted/20" />
            <div className="h-4 w-4 rounded-sm bg-[#14F195]/30" />
            <div className="h-4 w-4 rounded-sm bg-[#14F195]/60" />
            <div className="h-4 w-4 rounded-sm bg-[#14F195] opacity-90" />
            <span className="text-[10px] text-muted-foreground">More</span>
            <span className="text-[10px] text-muted-foreground ml-2">
              · Blue = streak freeze used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
