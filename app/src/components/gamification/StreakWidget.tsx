"use client";

import { cn } from "@/lib/utils";
import type { StreakData } from "@/types";

interface StreakWidgetProps {
  streak: StreakData;
  className?: string;
}

const MILESTONES = [7, 30, 100] as const;

export function StreakWidget({ streak, className }: StreakWidgetProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Last 28 days (4 weeks), starting from today - 27
  const days: Date[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const activeDays = new Set(
    streak.streakHistory.map((iso) => {
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  const totalActiveDays = activeDays.size;
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "text-base leading-none",
                streak.currentStreak >= 7 &&
                  "drop-shadow-[0_0_8px_rgba(245,166,35,0.7)]",
              )}
            >
              🔥
            </span>
            <span
              className={cn(
                "font-mono text-xl font-bold leading-none",
                streak.currentStreak >= 7
                  ? "text-[#F5A623]"
                  : streak.currentStreak > 0
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {streak.currentStreak}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              days
            </span>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="font-mono leading-none">
            <span className="text-sm font-semibold text-foreground">
              {streak.longestStreak}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">best</span>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="font-mono leading-none">
            <span className="text-sm font-semibold text-accent">
              {totalActiveDays}
            </span>
            <span className="text-[10px] text-muted-foreground ml-1">
              total
            </span>
          </div>
        </div>

        {/* 28-day grid */}
        <div className="flex-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: "repeat(28, 1fr)" }}
          >
            {/* Day-of-week labels */}
            {days.map((day, i) => (
              <div
                key={i}
                className="text-[8px] font-mono text-subtle text-center leading-none mb-0.5"
              >
                {i % 7 === 0 ? DAY_LABELS[day.getDay()] : ""}
              </div>
            ))}
            {/* Squares */}
            {days.map((day, i) => {
              const dayTime = day.getTime();
              const isToday = dayTime === today.getTime();
              const isActive = activeDays.has(dayTime);

              let bg: string;
              let shadow: string | undefined;
              if (isToday && isActive) {
                bg = "#1dff9f";
                shadow = "0 0 4px rgba(20,241,149,0.6)";
              } else if (isToday) {
                bg = "#1A2A22";
                shadow = "0 0 3px rgba(20,241,149,0.2)";
              } else if (isActive) {
                bg = "var(--accent)";
              } else {
                bg = "#1A1A1A";
              }

              return (
                <div
                  key={i}
                  title={`${day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${isActive ? " ✓" : ""}`}
                  className="rounded-[2px] cursor-default hover:scale-110 transition-transform"
                  style={{
                    aspectRatio: "1",
                    backgroundColor: bg,
                    boxShadow: shadow,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {MILESTONES.map((m) => {
            const reached = streak.longestStreak >= m;
            return (
              <div key={m} className="flex items-center gap-1">
                <span
                  className={cn(
                    "text-[10px]",
                    reached
                      ? "drop-shadow-[0_0_4px_rgba(245,166,35,0.5)]"
                      : "opacity-25 grayscale",
                  )}
                >
                  🔥
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    reached ? "text-[#F5A623]" : "text-subtle",
                  )}
                >
                  {m}d
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
