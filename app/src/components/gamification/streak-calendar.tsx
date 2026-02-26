"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StreakCalendarProps {
  streakHistory: Record<string, boolean>;
  className?: string;
}

function getDaysArray(weeks: number): string[] {
  const days: string[] = [];
  const today = new Date();
  const total = weeks * 7;

  for (let i = total - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const WEEK_DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function StreakCalendar({
  streakHistory,
  className,
}: StreakCalendarProps) {
  const t = useTranslations("gamification");
  const weeks = 12;
  const days = getDaysArray(weeks);

  // Group into columns (weeks), each column is 7 days (Sun-Sat)
  const columns: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeDays = days.filter((d) => streakHistory[d]).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("streak")} Calendar</p>
        <p className="text-xs text-muted-foreground">
          {activeDays} active {t("days")} (last {weeks} weeks)
        </p>
      </div>

      <div className="flex gap-[3px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pr-1">
          {WEEK_DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-[14px] w-6 text-[10px] text-muted-foreground flex items-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => {
              const active = streakHistory[day];
              const isToday = day === today;

              return (
                <div
                  key={day}
                  title={`${day}${active ? " ✓" : ""}`}
                  className={cn(
                    "h-[14px] w-[14px] rounded-[3px] transition-colors",
                    active
                      ? "bg-primary"
                      : "bg-muted",
                    isToday && !active && "ring-1 ring-primary/40",
                    isToday && active && "ring-1 ring-primary ring-offset-1 ring-offset-background"
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="h-[10px] w-[10px] rounded-[2px] bg-muted" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/30" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary/60" />
          <div className="h-[10px] w-[10px] rounded-[2px] bg-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
