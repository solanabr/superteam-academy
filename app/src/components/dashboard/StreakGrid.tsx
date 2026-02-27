
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakGridProps {
  activeDates?: string[];
}

export function StreakGrid({ activeDates = [] }: StreakGridProps) {
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState<Date[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate last 30 days
    const daysArray = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d;
    });
    setDays(daysArray);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#0A0A0F]/80 backdrop-blur-xl border border-[#2E2E36] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
           Learning Streak <span className="text-[#14F195]">🔥</span>
        </h3>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        <TooltipProvider>
          {days.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const isActive = activeDates.includes(dateStr);
            const isToday = i === 29;

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "w-4 h-4 rounded-[4px] border border-[#2E2E36] transition-all duration-300",
                      isActive 
                        ? "bg-[#14F195] border-[#14F195]/50 shadow-[0_0_10px_rgba(20,241,149,0.3)]" 
                        : "bg-[#1E1E24] hover:bg-[#2E2E36]",
                      isToday && !isActive && "border-[#9945FF]/50"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-black border-[#2E2E36] text-white text-[10px]">
                  <p>{date.toLocaleDateString()}</p>
                  <p className={isActive ? "text-[#14F195]" : "text-gray-500"}>
                    {isActive ? "Completed Lessons" : "No activity"}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      <div className="mt-4 flex justify-end items-center gap-2 text-[10px] text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-[1px] bg-[#1E1E24]" />
          <div className="w-2 h-2 rounded-[1px] bg-[#14F195]/40" />
          <div className="w-2 h-2 rounded-[1px] bg-[#14F195]/70" />
          <div className="w-2 h-2 rounded-[1px] bg-[#14F195]" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
