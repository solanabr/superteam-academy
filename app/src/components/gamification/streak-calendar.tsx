"use client";

import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StreakCalendarProps {
  currentStreak: number;
  longestStreak: number;
  activityData?: Record<string, number>;
}

function generateMockData(): Record<string, number> {
  const data: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    data[key] = Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : 0;
  }
  return data;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-superteam-green/20";
  if (count === 2) return "bg-superteam-green/40";
  if (count === 3) return "bg-superteam-green/60";
  return "bg-superteam-green/80";
}

export function StreakCalendar({
  currentStreak,
  longestStreak,
  activityData,
}: StreakCalendarProps) {
  const t = useTranslations("dashboard");
  const data = activityData || generateMockData();

  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    days.push({ date: key, count: data[key] || 0 });
  }

  // Arrange into weeks (columns of 7)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-superteam-orange" />
          <div>
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-sm text-muted-foreground ml-1">
              {t("dayStreak")}
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("longest")}: <span className="font-medium text-foreground">{longestStreak}</span> {t("days")}
        </div>
      </div>

      <TooltipProvider>
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-sm transition-colors",
                        getIntensityClass(day.count)
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {day.date}: {day.count} {day.count === 1 ? "activity" : "activities"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      </TooltipProvider>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t("less")}</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn("w-3 h-3 rounded-sm", getIntensityClass(i))}
          />
        ))}
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
