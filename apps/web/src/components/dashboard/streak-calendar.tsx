'use client';

import { useTranslations } from 'next-intl';
import type { StreakDay } from '@/lib/mock-data';

interface StreakCalendarProps {
  data: StreakDay[];
  currentStreak: number;
  streakFreezeAvailable: boolean;
}

function getColor(count: number): string {
  if (count === 0) return 'bg-muted';
  if (count === 1) return 'bg-emerald-900';
  if (count === 2) return 'bg-emerald-700';
  if (count === 3) return 'bg-emerald-500';
  if (count === 4) return 'bg-emerald-400';
  return 'bg-emerald-300';
}

export function StreakCalendar({ data, currentStreak, streakFreezeAvailable }: StreakCalendarProps) {
  const t = useTranslations('dashboard');

  // Group by weeks (7 days per column)
  const weeks: StreakDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('streak')}</h3>
        <div className="flex items-center gap-3">
          {streakFreezeAvailable && (
            <span className="text-sm text-muted-foreground" title={t('streakFreeze')}>
              🧊 {t('streakFreeze')}
            </span>
          )}
          <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
            🔥 {currentStreak} {t('days')}
          </span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`h-3 w-3 rounded-sm ${getColor(day.count)}`}
                title={`${day.date}: ${day.count} ${t('activities')}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <span>{t('less')}</span>
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div key={level} className={`h-3 w-3 rounded-sm ${getColor(level)}`} />
        ))}
        <span>{t('more')}</span>
      </div>
    </div>
  );
}
