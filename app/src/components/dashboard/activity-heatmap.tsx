'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DayData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  className?: string;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const WEEKS = 52;
const DAYS = 7;

/**
 * Generate mock activity data for the past 52 weeks.
 * Produces a realistic distribution: most days inactive,
 * some light activity, occasional bursts.
 */
function generateMockData(): DayData[] {
  const data: DayData[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - WEEKS * DAYS);

  // Use a seeded pseudo-random for deterministic rendering
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let i = 0; i < WEEKS * DAYS; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const dayOfWeek = date.getDay();
    const rand = seededRandom();

    // Weekdays slightly more active, weekends less
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const threshold = isWeekday ? 0.45 : 0.65;

    let count = 0;
    if (rand > threshold) {
      if (rand > 0.9) count = Math.floor(seededRandom() * 4) + 4; // High activity: 4-7
      else if (rand > 0.75) count = Math.floor(seededRandom() * 3) + 2; // Medium: 2-4
      else count = 1; // Light: 1
    }

    data.push({
      date: date.toISOString().split('T')[0]!,
      count,
    });
  }

  return data;
}

function getIntensityClass(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count <= 1) return 'bg-emerald-200 dark:bg-emerald-900';
  if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700';
  if (count <= 5) return 'bg-emerald-500 dark:bg-emerald-500';
  return 'bg-emerald-700 dark:bg-emerald-400';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ActivityHeatmap({ className }: ActivityHeatmapProps) {
  const t = useTranslations('dashboard');

  const data = useMemo(() => generateMockData(), []);

  // Organize data into a grid: weeks (columns) x days (rows)
  const grid = useMemo(() => {
    const weeks: (DayData | null)[][] = [];
    let currentWeek: (DayData | null)[] = [];

    // Pad the start to align with the correct day of week
    const firstDate = new Date(data[0]!.date + 'T00:00:00');
    // getDay: 0=Sun...6=Sat. We want Mon=0, so remap.
    const firstDayIndex = (firstDate.getDay() + 6) % 7;
    for (let p = 0; p < firstDayIndex; p++) {
      currentWeek.push(null);
    }

    for (const day of data) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data]);

  // Month labels positioned at the start of each month
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    grid.forEach((week, weekIdx) => {
      for (const day of week) {
        if (!day) continue;
        const month = new Date(day.date + 'T00:00:00').getMonth();
        if (month !== lastMonth) {
          labels.push({ label: MONTHS[month]!, weekIndex: weekIdx });
          lastMonth = month;
        }
        break; // only check first non-null day per week
      }
    });

    return labels;
  }, [grid]);

  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t('activity')}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalContributions} activities in the last year
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Month labels */}
            <div className="mb-1 flex">
              <div className="w-8 shrink-0" /> {/* Spacer for day labels */}
              <div className="relative flex-1">
                {monthLabels.map(({ label, weekIndex }) => (
                  <span
                    key={`${label}-${weekIndex}`}
                    className="absolute text-[10px] text-muted-foreground"
                    style={{ left: `${(weekIndex / grid.length) * 100}%` }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="mt-4 flex gap-px">
              {/* Day-of-week labels */}
              <div className="flex w-8 shrink-0 flex-col gap-px">
                {DAYS_OF_WEEK.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      'flex h-[11px] items-center text-[10px] text-muted-foreground',
                      i % 2 === 0 ? 'visible' : 'invisible',
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {grid.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-px">
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIdx}`}
                          className="size-[11px] rounded-[2px]"
                        />
                      );
                    }

                    return (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'size-[11px] rounded-[2px] transition-colors',
                              getIntensityClass(day.count),
                              day.count > 0 && 'cursor-pointer hover:ring-1 hover:ring-foreground/20',
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs font-medium">
                            {day.count === 0
                              ? 'No activity'
                              : `${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDate(day.date)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {[0, 1, 3, 5, 7].map((count) => (
                <div
                  key={count}
                  className={cn(
                    'size-[11px] rounded-[2px]',
                    getIntensityClass(count),
                  )}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
