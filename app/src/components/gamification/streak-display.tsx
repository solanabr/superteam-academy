'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { StreakService } from '@/lib/services/streak';
import { useTranslations } from 'next-intl';
import type { StreakData } from '@/types';
import { Flame } from 'lucide-react';

export function StreakDisplay() {
  const { publicKey } = useWallet();
  const t = useTranslations('gamification');
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    setStreak(StreakService.getStreak(publicKey.toBase58()));
  }, [publicKey]);

  if (!streak || streak.currentStreak === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Flame className="h-4 w-4 text-orange-500 animate-streak-flame" />
      <span className="font-medium text-orange-500">
        {streak.currentStreak}
      </span>
    </div>
  );
}

export function StreakCalendar() {
  const { publicKey } = useWallet();
  const [activity, setActivity] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!publicKey) return;
    setActivity(StreakService.getRecentActivity(publicKey.toBase58(), 30));
  }, [publicKey]);

  const days = Object.entries(activity).reverse();

  return (
    <div className="flex flex-wrap gap-1">
      {days.map(([date, active]) => (
        <div
          key={date}
          className={`w-4 h-4 rounded-sm ${
            active
              ? 'bg-solana-green'
              : 'bg-muted'
          }`}
          title={date}
          role="img"
          aria-label={`${date}: ${active ? 'active' : 'inactive'}`}
        />
      ))}
    </div>
  );
}
