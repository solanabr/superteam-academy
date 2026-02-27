"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakCalendarProps {
  streak: number;
  activeDates?: string[]; // ISO strings
}

export function StreakCalendar({ streak, activeDates = [] }: StreakCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState<Date[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate last 30 days only on client to avoid hydration mismatch
    const daysArray = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d;
    });
    setDays(daysArray);
  }, []);

  if (!mounted) {
      // Return a skeleton or empty state matching the server text to avoid layout shift
      return (
        <div className="flex flex-col items-center">
            <div className="text-4xl font-bold text-[#14F195] mb-2">{streak} 🔥</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Day Streak</div>
            <div className="flex gap-1 h-8 items-end">
                 {/* Render placeholders */}
                 {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="w-2 h-8 rounded-sm bg-[#1E1E24] opacity-50" />
                 ))}
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center">
        <div className="text-4xl font-bold text-[#14F195] mb-2">{streak} 🔥</div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Day Streak</div>
        
        <div className="flex gap-1">
            <TooltipProvider>
                {days.map((date, i) => {
                    // Use a stable date format for comparison if needed
                    const dateStr = date.toISOString().split('T')[0];
                    const isToday = i === 29;
                    
                    // Logic must match what we want to show. 
                    // If activeDates is empty, we show mock data or just today if streak > 0
                    // But to avoid "random" mismatches, strictly use passed props or deterministic logic.
                    // Removing Math.random() for stability.
                    const isActive = activeDates.includes(dateStr) || (isToday && streak > 0);
                    
                    return (
                        <Tooltip key={i}>
                            <TooltipTrigger>
                                <div 
                                    className={cn(
                                        "w-2 h-8 rounded-sm transition-all duration-300",
                                        isActive ? "bg-[#14F195] shadow-[0_0_8px_#14F19555]" : "bg-[#1E1E24]"
                                    )}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{date.toLocaleDateString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
    </div>
  );
}
