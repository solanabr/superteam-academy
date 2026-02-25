// app/src/components/streak-card.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Функция для генерации дат последних 12 недель (84 дня)
// Чтобы сетка была 7 строк (пн-вс) на 12 колонок
function generateHeatmapData() {
  const days = [];
  const today = new Date();
  // Сбрасываем время для точного сравнения
  today.setHours(0, 0, 0, 0);

  // Начинаем с воскресенья 12 недель назад
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (12 * 7) + 1);

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
  
  const streak = userDb?.streak || 0;

  useEffect(() => {
    if (userDb?.walletAddress) {
        fetch(`/api/user/activity?wallet=${userDb.walletAddress}`)
            .then(res => res.json())
            .then(data => {
                // Оптимизация: переводим в Set для мгновенного поиска O(1)
                setActivityDates(new Set(data.dates));
            });
    }
  }, [userDb]);

  const heatmapDays = generateHeatmapData();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Card className="col-span-1 h-full bg-card/40 border-muted-foreground/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <div className="flex flex-col space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">Activity Map</CardTitle>
            <span className="text-xs text-muted-foreground">Your learning consistency</span>
        </div>
        <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 shadow-sm">
                <Flame className={cn("h-4 w-4", streak > 0 ? "fill-orange-500 animate-pulse" : "")} />
                <span className="font-bold text-sm">{streak} Day Streak</span>
            </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <TooltipProvider delayDuration={100}>
            {/* 
              Используем CSS Grid. 
              grid-flow-col заставляет элементы заполнять колонки сверху вниз (как на GitHub).
              grid-rows-7 означает 7 дней в неделе.
            */}
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 overflow-x-auto pb-2">
                {heatmapDays.map((dateObj, index) => {
                    // Переводим локальную дату в формат YYYY-MM-DD с учетом таймзоны
                    // Чтобы избежать сдвигов дат
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;

                    const isActive = activityDates.has(dateStr);
                    const isToday = dateStr === todayStr;
                    // Если дата в будущем - делаем ячейку невидимой/отключенной
                    const isFuture = dateObj > new Date(); 
                    
                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <div 
                                    className={cn(
                                        "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-all duration-300",
                                        // Цвета
                                        isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted/40",
                                        // Сегодняшний день
                                        isToday && !isActive && "ring-1 ring-primary/50 bg-primary/20",
                                        isToday && isActive && "ring-2 ring-white/50",
                                        // Ховер (только если не в будущем)
                                        !isFuture && "hover:ring-1 hover:ring-foreground/30 cursor-pointer",
                                        // Будущее
                                        isFuture && "opacity-10 cursor-default"
                                    )}
                                />
                            </TooltipTrigger>
                            {!isFuture && (
                                <TooltipContent side="top" className="bg-popover border text-xs font-medium px-3 py-1.5">
                                    <p>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                    <p className={isActive ? "text-green-400" : "text-muted-foreground"}>
                                        {isActive ? "Lessons completed!" : "No activity"}
                                    </p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>

        <div className="mt-6 flex justify-end items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>Less</span>
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-muted/40" />
                <div className="w-3 h-3 rounded-[2px] bg-green-500/40" />
                <div className="w-3 h-3 rounded-[2px] bg-green-500/70" />
                <div className="w-3 h-3 rounded-[2px] bg-green-500" />
            </div>
            <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}