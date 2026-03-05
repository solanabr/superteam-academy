"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

type StreakCalendarProps = {
  streakDays: number;
  /** Account opening date (ISO string or Date). Months before this cannot be navigated to. */
  accountOpenedAt?: string | Date;
  /** Override active dates from gamification service. Format: "year-month-day" (month 0-indexed). */
  activeDatesOverride?: Set<string>;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** Stub active days: today, yesterday, 3 days ago, 5, 6, 8, 10, 12, 14 days ago */
function getStubActiveDates(): Set<string> {
  const active = new Set<string>();
  const offsets = [0, 1, 3, 5, 6, 8, 10, 12, 14];
  const today = new Date();
  for (const offset of offsets) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    active.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return active;
}

export function StreakCalendar({
  streakDays,
  accountOpenedAt,
  activeDatesOverride,
}: StreakCalendarProps) {
  const t = useTranslations("dashboard");
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const openDate = accountOpenedAt
    ? new Date(accountOpenedAt)
    : new Date(2025, 0, 1);
  const openYear = openDate.getFullYear();
  const openMonth = openDate.getMonth();

  const canGoBack =
    viewYear > openYear || (viewYear === openYear && viewMonth > openMonth);
  const canGoForward =
    viewYear < today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const handlePrev = () => {
    if (!canGoBack) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    if (!canGoForward) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const activeDates =
    activeDatesOverride && activeDatesOverride.size > 0
      ? activeDatesOverride
      : getStubActiveDates();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const todayDate = today.getDate();

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Month header with navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canGoBack}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold capitalize text-foreground">
          {monthName}
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoForward}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className="flex h-6 items-center justify-center text-[10px] font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="h-7 w-full" />;
          }

          const isToday = isCurrentMonth && day === todayDate;
          const isFuture = isCurrentMonth
            ? day > todayDate
            : viewYear > today.getFullYear() ||
              (viewYear === today.getFullYear() &&
                viewMonth > today.getMonth());
          const key = `${viewYear}-${viewMonth}-${day}`;
          const isActive = activeDates.has(key);

          let cellClass =
            "flex h-7 w-full items-center justify-center rounded-sm text-[10px] font-medium transition-colors";

          if (isFuture) {
            cellClass += " bg-muted/30 text-muted-foreground/40";
          } else if (isActive) {
            cellClass += " streak-day-active text-white";
          } else {
            cellClass += " bg-muted text-muted-foreground";
          }

          if (isToday) {
            cellClass +=
              " streak-day-today ring-2 ring-offset-1 ring-offset-background";
          }

          return (
            <div key={day} className={cellClass}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Current streak */}
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {t("streak")}: {streakDays} {t("days")}
      </p>
    </div>
  );
}
