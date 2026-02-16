'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  streakDays: number;
  streakHistory: string[];
  className?: string;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function StreakCalendar({
  streakDays,
  streakHistory,
  className,
}: StreakCalendarProps) {
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks: { date: Date; active: boolean; isToday: boolean; isFuture: boolean }[][] = [];
    const historySet = new Set(streakHistory);

    // Generate 12 weeks of data (84 days)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);
    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentWeek: typeof weeks[0] = [];

    for (let i = 0; i < 84; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isFuture = date > today;

      currentWeek.push({
        date,
        active: historySet.has(dateStr),
        isToday,
        isFuture,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [streakHistory]);

  return (
    <div className={cn('', className)}>
      {/* Streak counter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-2xl font-bold text-orange-500">{streakDays}</span>
          <span className="text-sm text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {/* Day labels */}
        <div className="flex gap-[3px] mb-1">
          {DAYS_OF_WEEK.map((day, i) => (
            <div
              key={i}
              className="w-[14px] h-[14px] flex items-center justify-center text-[8px] text-muted-foreground"
            >
              {i % 2 === 0 ? day : ''}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {calendarData.map((week, wi) => (
          <div key={wi} className="flex gap-[3px]">
            {week.map((day, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.005 }}
                className={cn(
                  'w-[14px] h-[14px] rounded-[3px] transition-colors',
                  day.isFuture
                    ? 'bg-transparent'
                    : day.active
                    ? 'bg-orange-500 hover:bg-orange-400'
                    : day.isToday
                    ? 'bg-muted ring-1 ring-primary/30'
                    : 'bg-muted/50 hover:bg-muted'
                )}
                title={
                  day.isFuture
                    ? ''
                    : `${day.date.toLocaleDateString()} ${day.active ? '(Active)' : ''}`
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[10px] rounded-[2px] bg-muted/50" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-500/30" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-500/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-orange-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
