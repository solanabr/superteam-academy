"use client";

import { cn } from "@/lib/utils";
import type { StreakData } from "@/types";

interface StreakWidgetProps {
  streak: StreakData;
  className?: string;
}

const MILESTONES = [7, 30, 100] as const;

function getMilestoneLabel(days: number): string | null {
  if (days >= 100) return "100";
  if (days >= 30) return "30";
  if (days >= 7) return "7";
  return null;
}

export function StreakWidget({ streak, className }: StreakWidgetProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build the 12-week grid (84 days), starting from Sunday of the week 12 weeks ago
  const gridStart = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sun
  gridStart.setDate(today.getDate() - dayOfWeek - 11 * 7);

  const activeDays = new Set(
    streak.streakHistory.map((iso) => {
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  // 12 columns (weeks), 7 rows (days Sun–Sat)
  const weeks: Date[][] = [];
  for (let w = 0; w < 12; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(gridStart);
      cell.setDate(gridStart.getDate() + w * 7 + d);
      week.push(cell);
    }
    weeks.push(week);
  }

  // Month labels: show month name above the first week that starts in that month
  const monthLabels: Array<{ colIndex: number; label: string }> = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    const m = firstDay.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({
        colIndex: wi,
        label: firstDay.toLocaleString("en-US", { month: "short" }),
      });
      lastMonth = m;
    }
  });

  const activeMilestone = getMilestoneLabel(streak.currentStreak);
  const totalActiveDays = activeDays.size;

  return (
    <div className={cn("w-full", className)}>
      {/* Stats row */}
      <div className="flex items-center gap-5 mb-4">
        {/* Current streak */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-lg leading-none transition-all",
              streak.currentStreak >= 7 &&
                "drop-shadow-[0_0_10px_rgba(245,166,35,0.7)]"
            )}
          >
            🔥
          </span>
          <div className="font-mono leading-none">
            <span
              className={cn(
                "text-2xl font-bold",
                streak.currentStreak >= 7
                  ? "text-[#F5A623]"
                  : streak.currentStreak > 0
                  ? "text-[#EDEDED]"
                  : "text-[#666666]"
              )}
            >
              {streak.currentStreak}
            </span>
            <span className="text-[10px] text-[#666666] ml-1">day streak</span>
          </div>
          {activeMilestone && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm"
              style={{
                color: "#F5A623",
                backgroundColor: "rgba(245,166,35,0.15)",
                border: "1px solid rgba(245,166,35,0.35)",
                boxShadow: "0 0 8px rgba(245,166,35,0.2)",
              }}
            >
              🔥 {activeMilestone}d
            </span>
          )}
        </div>

        <div className="h-6 w-px bg-[#1F1F1F]" />

        {/* Longest streak */}
        <div className="font-mono leading-none">
          <span className="text-sm font-semibold text-[#EDEDED]">
            {streak.longestStreak}
          </span>
          <span className="text-[10px] text-[#666666] ml-1">longest</span>
        </div>

        <div className="h-6 w-px bg-[#1F1F1F]" />

        {/* Total active days */}
        <div className="font-mono leading-none">
          <span className="text-sm font-semibold text-[#14F195]">
            {totalActiveDays}
          </span>
          <span className="text-[10px] text-[#666666] ml-1">total days</span>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div
          className="grid mb-1"
          style={{ gridTemplateColumns: `repeat(12, 1fr)`, gap: "2px" }}
        >
          {weeks.map((week, wi) => {
            const label = monthLabels.find((m) => m.colIndex === wi);
            return (
              <div
                key={wi}
                className="text-[9px] font-mono text-[#666666] text-center truncate"
              >
                {label ? label.label : ""}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(12, 1fr)`, gap: "2px" }}
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => {
                const dayTime = day.getTime();
                const todayTime = today.getTime();
                const isToday = dayTime === todayTime;
                const isActive = activeDays.has(dayTime);
                const isFuture = dayTime > todayTime;

                let bgColor: string;
                let shadow: string | undefined;

                if (isFuture) {
                  bgColor = "#111111";
                } else if (isToday && isActive) {
                  bgColor = "#1dff9f";
                  shadow = "0 0 6px rgba(20,241,149,0.7)";
                } else if (isToday) {
                  bgColor = "#1A2A22";
                  shadow = "0 0 4px rgba(20,241,149,0.2)";
                } else if (isActive) {
                  bgColor = "#14F195";
                } else {
                  bgColor = "#1A1A1A";
                }

                return (
                  <div
                    key={di}
                    title={`${day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${isActive ? " — active" : ""}`}
                    className="rounded-[2px] cursor-default transition-transform hover:scale-110"
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      backgroundColor: bgColor,
                      boxShadow: shadow,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1F1F1F]">
        <span className="text-[9px] font-mono text-[#666666] uppercase tracking-wider">
          Milestones
        </span>
        {MILESTONES.map((m) => {
          const reached = streak.longestStreak >= m;
          return (
            <div key={m} className="flex items-center gap-1">
              <span
                className={cn(
                  "text-[10px] transition-all",
                  reached
                    ? "drop-shadow-[0_0_6px_rgba(245,166,35,0.6)]"
                    : "opacity-30 grayscale"
                )}
              >
                🔥
              </span>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  reached ? "text-[#F5A623]" : "text-[#444444]"
                )}
              >
                {m}d
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
