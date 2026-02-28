'use client';

import { cn } from '@/lib/utils';

interface StreakCalendarProps {
  streakDays: number;
  labels: { today: string; daysAgo: string };
}

// Generate last 28 days of mock activity data based on streak
function generateActivity(streakDays: number): number[] {
  const days: number[] = [];
  for (let i = 27; i >= 0; i--) {
    if (i < streakDays) {
      // Active days within streak: random XP 50-200
      days.push(50 + Math.floor(Math.abs(Math.sin(i * 7.3)) * 150));
    } else if (Math.abs(Math.sin(i * 3.7)) > 0.6) {
      // Some older days had activity too
      days.push(30 + Math.floor(Math.abs(Math.sin(i * 5.1)) * 100));
    } else {
      days.push(0);
    }
  }
  return days;
}

const INTENSITY = [
  'bg-gray-800',           // 0: no activity
  'bg-green-900/60',       // 1: low
  'bg-green-700/70',       // 2: medium
  'bg-green-500/80',       // 3: high
  'bg-green-400',          // 4: very high
];

function getIntensity(xp: number): number {
  if (xp === 0) return 0;
  if (xp < 50) return 1;
  if (xp < 100) return 2;
  if (xp < 150) return 3;
  return 4;
}

const DAYS_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakCalendar({ streakDays, labels }: StreakCalendarProps) {
  const activity = generateActivity(streakDays);

  return (
    <div>
      <div className="flex items-end gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {DAYS_LABELS.map((d, i) => (
            <div key={i} className="h-3.5 w-4 flex items-center justify-center text-[8px] text-gray-600">
              {i % 2 === 0 ? d : ''}
            </div>
          ))}
        </div>
        {/* Calendar grid: 4 weeks x 7 days */}
        {[0, 1, 2, 3].map((week) => (
          <div key={week} className="flex flex-col gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const idx = week * 7 + day;
              const xp = activity[idx] ?? 0;
              const level = getIntensity(xp);
              return (
                <div
                  key={day}
                  className={cn(
                    'h-3.5 w-3.5 rounded-[3px] transition-colors',
                    INTENSITY[level]
                  )}
                  title={xp > 0 ? `${xp} XP` : labels.today}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] text-gray-600">{labels.daysAgo}</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-gray-600">Less</span>
          {INTENSITY.map((cls, i) => (
            <div key={i} className={cn('h-2.5 w-2.5 rounded-[2px]', cls)} />
          ))}
          <span className="text-[9px] text-gray-600">More</span>
        </div>
        <span className="text-[9px] text-gray-600">{labels.today}</span>
      </div>
    </div>
  );
}
