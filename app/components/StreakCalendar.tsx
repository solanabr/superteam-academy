'use client';

import type { StreakData } from '@/lib/services/types';

const WEEKS = 6;
const DAYS_PER_WEEK = 7;

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function StreakCalendar({ data }: { data: StreakData | null }) {
  if (!data) return null;

  const historySet = new Set(
    data.history.filter((h) => h.completed > 0).map((h) => h.date)
  );
  const today = toISO(new Date());

  // Build grid: last WEEKS * DAYS_PER_WEEK days, row = week (oldest first), col = day of week (Sun=0)
  const cells: { date: string; hasActivity: boolean; isToday: boolean }[] = [];
  const start = new Date();
  start.setDate(start.getDate() - WEEKS * DAYS_PER_WEEK + 1);
  for (let i = 0; i < WEEKS * DAYS_PER_WEEK; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = toISO(d);
    cells.push({
      date: dateStr,
      hasActivity: historySet.has(dateStr),
      isToday: dateStr === today,
    });
  }

  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <p className="text-caption mb-3 font-medium text-[rgb(var(--text-muted))]">
        Streak history (last {WEEKS} weeks)
      </p>
      <div className="flex gap-1 overflow-x-auto">
        <div className="flex shrink-0 flex-col gap-1 text-[10px] text-[rgb(var(--text-subtle))]">
          {weekLabels.map((label) => (
            <div key={label} className="flex h-3.5 items-center pr-1">
              {label}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {Array.from({ length: WEEKS }, (_, weekIdx) => (
            <div key={weekIdx} className="flex gap-0.5">
              {cells.slice(weekIdx * DAYS_PER_WEEK, (weekIdx + 1) * DAYS_PER_WEEK).map((cell) => (
                <div
                  key={cell.date}
                  className={`h-3.5 w-3.5 shrink-0 rounded-sm ${
                    cell.hasActivity
                      ? 'bg-success'
                      : cell.isToday
                        ? 'ring-1 ring-inset ring-[rgb(var(--text-subtle))]'
                        : 'bg-surface-elevated'
                  }`}
                  title={`${cell.date}${cell.hasActivity ? ' · activity' : ''}`}
                  aria-hidden
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-[rgb(var(--text-subtle))]">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-surface-elevated" /> Less
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-success" /> Activity
        </span>
      </div>
    </div>
  );
}
