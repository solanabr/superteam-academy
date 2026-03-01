'use client';

import { useEffect, useState } from 'react';
import { getStreak, recordActivity, type StreakData } from '@/lib/streak';

export default function StreakDisplay() {
  const [streak, setStreak] = useState<ReturnType<typeof getStreak> | null>(null);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  if (!streak) return null;

  const isActive = streak.lastActivityDate === new Date().toISOString().split('T')[0];

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
          isActive ? 'bg-orange-500/10' : 'bg-surface-800'
        }`}>
          {isActive ? '🔥' : '❄️'}
        </div>
        <div>
          <div className="text-2xl font-bold text-surface-50">
            {streak.currentStreak}
          </div>
          <div className="text-sm text-surface-200">
            {isActive ? 'day streak' : 'streak paused'}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-sm text-surface-200">Best</div>
          <div className="text-lg font-bold text-accent-400">{streak.longestStreak}</div>
        </div>
      </div>

      {/* Last 7 days */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const active = streak.history.includes(dateStr);
          return (
            <div
              key={i}
              className={`h-6 flex-1 rounded ${active ? 'bg-brand-500' : 'bg-surface-800'}`}
              title={dateStr}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-surface-200">
        <span>7d ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
