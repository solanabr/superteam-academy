"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import type { StreakData } from "@/lib/services/types";

interface StreakCalendarProps {
  streak: StreakData;
  className?: string;
}

export function StreakCalendar({ streak, className }: StreakCalendarProps) {
  const [tooltip, setTooltip] = useState<{
    date: string;
    x: number;
    y: number;
  } | null>(null);

  // Build 12 weeks (84 days) of history
  const days = (() => {
    const values = Object.values(streak.activityHistory).map((v) =>
      typeof v === "number" ? v : v ? 1 : 0,
    );
    const maxXp = Math.max(1, ...values);
    return Array.from({ length: 84 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (83 - i));
      const key = date.toISOString().split("T")[0];
      const raw = streak.activityHistory[key];
      const xp = typeof raw === "number" ? raw : raw ? 1 : 0;
      const level = xp === 0 ? 0 : Math.min(4, Math.ceil((xp / maxXp) * 4));
      return { date: key, completions: level };
    });
  })();

  const getHeatmapClass = (completions: number) => {
    if (completions === 0) return "heatmap-0";
    if (completions === 1) return "heatmap-1";
    if (completions === 2) return "heatmap-2";
    if (completions === 3) return "heatmap-3";
    return "heatmap-4";
  };

  const isActive = streak.currentStreak > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Streak badge */}
      <div className="flex items-center justify-between">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)]"
          role="status"
          aria-live="polite"
          aria-label={`Current streak: ${streak.currentStreak} days`}
        >
          <Flame
            className={cn(
              "w-4 h-4",
              isActive
                ? "text-[var(--streak)] fill-[var(--streak)]"
                : "text-[var(--c-text-2)]",
            )}
          />
          <span className="font-mono text-sm font-semibold text-[var(--c-text)]">
            {streak.currentStreak}
          </span>
          <span className="text-xs text-[var(--c-text-2)]">day streak</span>
        </div>
        <div className="text-right text-sm text-[var(--c-text-2)]">
          <span>
            Best: <span className="font-mono">{streak.longestStreak}</span>
          </span>
          {streak.freezesAvailable > 0 && (
            <span className="ml-3 text-[#03E1FF]">
              {streak.freezesAvailable} freezes
            </span>
          )}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="relative overflow-x-auto">
        <div
          role="grid"
          aria-label="Activity heatmap"
          className="grid grid-rows-7 gap-1 auto-cols-max grid-flow-col"
        >
          {days.map((day) => (
            <div
              key={day.date}
              role="gridcell"
              tabIndex={0}
              aria-label={`${day.date}: ${day.completions > 0 ? `${day.completions} completion${day.completions !== 1 ? "s" : ""}` : "no activity"}`}
              className={cn(
                "w-3 h-3 rounded-[2px] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#55E9AB] focus:ring-offset-1 focus:ring-offset-[#000000]",
                getHeatmapClass(day.completions),
              )}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  date: day.date,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  date: day.date,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
              onBlur={() => setTooltip(null)}
            />
          ))}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 rounded-[2px] bg-[var(--c-bg-card)] border border-[var(--c-border-prominent)] px-2 py-1 text-xs font-mono text-[var(--c-text)] shadow-lg pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 32,
              transform: "translateX(-50%)",
            }}
          >
            {tooltip.date}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--c-text-2)]">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[2px] heatmap-0" />
        <div className="w-3 h-3 rounded-[2px] heatmap-1" />
        <div className="w-3 h-3 rounded-[2px] heatmap-2" />
        <div className="w-3 h-3 rounded-[2px] heatmap-3" />
        <div className="w-3 h-3 rounded-[2px] heatmap-4" />
        <span>More</span>
      </div>
    </div>
  );
}
