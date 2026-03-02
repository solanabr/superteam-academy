"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface ContributionCalendarProps {
  activityCalendar: Record<string, boolean>;
  className?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Day label config: which rows get a label (Mon=1, Wed=3, Fri=5)
const DAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

function toKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface Cell {
  key: string;
  active: boolean;
}

export function ContributionCalendar({ activityCalendar, className }: ContributionCalendarProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back 52 weeks and align to the nearest Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 52 * 7);
    start.setDate(start.getDate() - start.getDay()); // rewind to Sunday

    const weeks: (Cell | null)[][] = [];
    const monthLabels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    const cursor = new Date(start);

    while (cursor <= today) {
      const week: (Cell | null)[] = [];

      for (let d = 0; d < 7; d++) {
        if (cursor > today) {
          week.push(null);
        } else {
          const key = toKey(cursor);
          week.push({ key, active: !!activityCalendar[key] });

          // Record month label at the first cell (Sunday) of a new month
          if (d === 0 && cursor.getMonth() !== lastMonth) {
            monthLabels.push({ col: weeks.length, label: MONTHS[cursor.getMonth()] });
            lastMonth = cursor.getMonth();
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push(week);
    }

    return { weeks, monthLabels };
  }, [activityCalendar]);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="inline-flex min-w-max flex-col" style={{ gap: "3px" }}>

        {/* Month labels row */}
        <div className="flex" style={{ paddingLeft: "28px", gap: "2px" }}>
          {weeks.map((_, wi) => {
            const label = monthLabels.find((m) => m.col === wi);
            return (
              <div
                key={wi}
                className="text-muted-foreground"
                style={{ width: "10px", fontSize: "9px", lineHeight: "12px", overflow: "visible", whiteSpace: "nowrap" }}
              >
                {label?.label ?? ""}
              </div>
            );
          })}
        </div>

        {/* Grid: day-label column + week columns */}
        <div className="flex" style={{ gap: "2px" }}>

          {/* Day labels */}
          <div className="flex flex-col" style={{ gap: "2px", width: "26px", paddingRight: "4px" }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex items-center text-muted-foreground"
                style={{ height: "10px", fontSize: "9px", lineHeight: "10px" }}
              >
                {DAY_LABELS[i] ?? ""}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap: "2px" }}>
              {week.map((cell, di) =>
                cell === null ? (
                  <div key={di} style={{ width: "10px", height: "10px" }} />
                ) : (
                  <div
                    key={di}
                    title={`${cell.key}: ${cell.active ? "Active" : "No activity"}`}
                    className={cn(
                      "rounded-sm transition-colors",
                      cell.active
                        ? "bg-brazil-green hover:brightness-125"
                        : "bg-muted hover:bg-muted-foreground/20"
                    )}
                    style={{ width: "10px", height: "10px" }}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div
          className="flex items-center justify-end text-muted-foreground"
          style={{ gap: "3px", fontSize: "9px", paddingTop: "2px" }}
        >
          <span>Less</span>
          {["bg-muted", "bg-brazil-green/25", "bg-brazil-green/50", "bg-brazil-green/75", "bg-brazil-green"].map(
            (cls, i) => (
              <div key={i} className={cn("rounded-sm", cls)} style={{ width: "10px", height: "10px" }} />
            )
          )}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
