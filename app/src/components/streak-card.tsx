// app/src/components/streak-card.tsx
"use client";

import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakCard() {
  const { userDb } = useUser();
  const streak = userDb?.streak || 0;

  // Визуализация календаря (фейковая для красоты, но активный день реальный)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay() - 1; // 0 = Monday (примерно)

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
        <Flame className={cn("h-4 w-4", streak > 0 ? "text-orange-500 fill-orange-500" : "text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold">{streak}</div>
            <span className="text-sm text-muted-foreground">days</span>
        </div>
        
        <div className="mt-4 flex justify-between">
            {days.map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs border",
                        // Если сегодня или в стрике - подсвечиваем (упрощенная логика)
                        i === (todayIndex < 0 ? 6 : todayIndex) && streak > 0 
                            ? "bg-orange-500 border-orange-500 text-white" 
                            : "bg-background border-muted"
                    )}>
                        {i === (todayIndex < 0 ? 6 : todayIndex) && streak > 0 ? "✓" : ""}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}