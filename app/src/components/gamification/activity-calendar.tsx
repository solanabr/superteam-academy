"use client";

import { cn } from "@/lib/utils";

interface ActivityCalendarProps {
  activityCalendar: Record<string, boolean>;
  days?: number;
  className?: string;
}

export function ActivityCalendar({ activityCalendar, days = 30, className }: ActivityCalendarProps) {
  const calendarDays: [string, boolean][] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    calendarDays.push([key, !!activityCalendar[key]]);
  }

  return (
    <div className={cn("grid grid-cols-10 gap-1", className)}>
      {calendarDays.map(([date, active]) => (
        <div
          key={date}
          title={`${date}: ${active ? "Active" : "Inactive"}`}
          className={cn(
            "h-4 w-full rounded-sm transition-colors",
            active ? "bg-brazil-green" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}
