"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

function generateHeatmapData() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 12 * 7 + 1);

  for (let i = 0; i < 84; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function StreakCard() {
  const { userDb } = useUser();
  const [activityDates, setActivityDates] = useState<Set<string>>(new Set());
  const t = useTranslations("DashboardWidgets");

  const streak = userDb?.streak || 0;

  useEffect(() => {
    if (userDb?.walletAddress) {
      fetch(`/api/user/activity?wallet=${userDb.walletAddress}`)
        .then((res) => res.json())
        .then((data) => setActivityDates(new Set(data.dates)));
    }
  }, [userDb]);

  const heatmapDays = generateHeatmapData();
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <Card className="h-full border-border/60 bg-card/70 shadow-lg backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div className="flex flex-col space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">{t("activityMap")}</CardTitle>
          <span className="text-xs text-muted-foreground">{t("learningConsistency")}</span>
        </div>
        <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-orange-500 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Flame className={cn("h-4 w-4", streak > 0 ? "animate-pulse fill-orange-500" : "")} />
            <span className="text-sm font-bold">{t("dayStreak", { streak })}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <TooltipProvider delayDuration={100}>
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
            {heatmapDays.map((dateObj, index) => {
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, "0");
              const day = String(dateObj.getDate()).padStart(2, "0");
              const dateStr = `${year}-${month}-${day}`;

              const isActive = activityDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const isFuture = dateObj > new Date();

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-3.5 w-3.5 rounded-[3px] transition-all duration-300 sm:h-4 sm:w-4",
                        isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted/40",
                        isToday && !isActive && "bg-primary/20 ring-1 ring-primary/50",
                        isToday && isActive && "ring-2 ring-foreground/50",
                        !isFuture && "cursor-pointer hover:ring-1 hover:ring-foreground/30",
                        isFuture && "cursor-default opacity-10"
                      )}
                    />
                  </TooltipTrigger>
                  {!isFuture && (
                    <TooltipContent side="top" className="border bg-popover px-3 py-1.5 text-xs font-medium">
                      <p>{dateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                      <p className={isActive ? "text-green-400" : "text-muted-foreground"}>{isActive ? t("lessonsCompleted") : t("noActivity")}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="mt-6 flex items-center justify-end gap-2 text-xs font-medium text-muted-foreground">
          <span>{t("less")}</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-[2px] bg-muted/40" />
            <div className="h-3 w-3 rounded-[2px] bg-green-500/40" />
            <div className="h-3 w-3 rounded-[2px] bg-green-500/70" />
            <div className="h-3 w-3 rounded-[2px] bg-green-500" />
          </div>
          <span>{t("more")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
