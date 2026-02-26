"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Calendar } from "lucide-react";
import { Streak } from "@/types";
import { cn } from "@/lib/utils/cn";

interface StreakCalendarProps {
  streak: Streak;
  className?: string;
}

export function StreakCalendar({ streak, className }: StreakCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const last90 = streak.history.slice(-90);
  const weeks: typeof streak.history[] = [];
  for (let i = 0; i < last90.length; i += 7) {
    weeks.push(last90.slice(i, i + 7));
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={cn("glass-card p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-sm mb-1">Learning Streak</h3>
          <p className="text-xs text-muted-foreground">Last 90 days</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xl font-bold">{streak.currentStreak}</span>
            </div>
            <p className="text-xs text-muted-foreground">current</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <span className="text-xl font-bold text-muted-foreground">
              {streak.longestStreak}
            </span>
            <p className="text-xs text-muted-foreground">longest</p>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => {
              const isToday = day.date === today;
              return (
                <motion.div
                  key={day.date}
                  whileHover={{ scale: 1.3 }}
                  onHoverStart={() => setHoveredDay(day.date)}
                  onHoverEnd={() => setHoveredDay(null)}
                  className={cn(
                    "w-3 h-3 rounded-sm cursor-pointer transition-all duration-150",
                    day.isActive
                      ? "bg-[#14F195]"
                      : "bg-white/10",
                    isToday && "ring-1 ring-[#9945FF]"
                  )}
                  style={{
                    opacity: day.isActive ? Math.min(0.4 + day.xpEarned / 300, 1) : 0.15,
                  }}
                  title={`${day.date}: ${day.isActive ? `${day.xpEarned} XP` : "No activity"}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Hovered day info */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-muted-foreground"
        >
          {hoveredDay}:{" "}
          {streak.history.find((d) => d.date === hoveredDay)?.isActive
            ? `${streak.history.find((d) => d.date === hoveredDay)?.xpEarned} XP earned`
            : "No activity"}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        {[0.15, 0.35, 0.55, 0.75, 1].map((opacity, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm bg-[#14F195]"
            style={{ opacity }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Streak milestones */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
        {[
          { days: 7, label: "Week", emoji: "🔥" },
          { days: 30, label: "Month", emoji: "⚡" },
          { days: 100, label: "100 Days", emoji: "👑" },
        ].map((milestone) => (
          <div
            key={milestone.days}
            className={cn(
              "flex-1 text-center p-2 rounded-lg text-xs",
              streak.currentStreak >= milestone.days
                ? "bg-[#14F195]/10 border border-[#14F195]/20 text-[#14F195]"
                : "bg-white/5 border border-white/10 text-muted-foreground"
            )}
          >
            <span className="text-base">{milestone.emoji}</span>
            <p className="font-medium mt-0.5">{milestone.label}</p>
            <p className="text-[10px] opacity-70">{milestone.days} days</p>
          </div>
        ))}
      </div>
    </div>
  );
}
