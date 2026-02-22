"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Fire } from "@phosphor-icons/react";
import type { StreakData } from "@superteam-lms/types";
import {
  isActiveToday,
  generateWeekCalendar,
  getStreakMilestones,
} from "@/lib/gamification";
import { cn, todayDateString } from "@/lib/utils";

interface StreakDisplayProps {
  streak: StreakData;
  className?: string;
}

export function StreakDisplay({ streak, className }: StreakDisplayProps) {
  const t = useTranslations("gamification");
  const locale = useLocale();
  const activeToday = isActiveToday(streak);
  const calendar = generateWeekCalendar(streak.streakHistory);
  const milestones = getStreakMilestones(streak.currentStreak);

  const todayDate = todayDateString();

  return (
    <div className={cn("card-chunky p-6", className)}>
      {/* Header: flame icon + streak count */}
      <div className="mb-4 flex items-center gap-3.5">
        <div className="flex h-12 w-12 animate-breathe items-center justify-center rounded-[14px] bg-streak-light">
          <Fire size={24} weight="duotone" className="text-streak" />
        </div>
        <div>
          <div className="font-display text-[26px] font-black leading-tight">
            {t("streakDays", { count: streak.currentStreak })}
          </div>
          <div className="font-body text-[13px] text-text-3">
            {activeToday ? t("active") : t("streakKeepGoing")}
          </div>
        </div>
      </div>

      {/* Weekly day circles */}
      <div className="flex gap-1.5" role="img" aria-label={t("streak")}>
        {calendar.map((day) => {
          const isToday = day.date === todayDate;
          const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString(
            locale,
            { weekday: "narrow" }
          );
          return (
            <div
              key={day.date}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-[2.5px] font-display text-[13px] font-extrabold transition-colors",
                isToday
                  ? "animate-pulse-ring border-primary-dark bg-primary text-white shadow-[0_2px_0_0_var(--primary-dark)]"
                  : day.active
                    ? "border-success bg-success-light text-success-dark shadow-[0_2px_0_0_var(--success-dark)]"
                    : "border-border bg-subtle text-text-3"
              )}
              title={day.date}
            >
              {dayLabel}
            </div>
          );
        })}
      </div>

      {/* Milestone badges */}
      {milestones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {milestones.map((milestone) => (
            <span
              key={milestone.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary-bg px-2.5 py-1 font-display text-xs font-bold"
            >
              <Fire size={14} weight="duotone" className="text-streak" />
              {milestone.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
