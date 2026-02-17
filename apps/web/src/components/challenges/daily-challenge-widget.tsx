'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Zap, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { challengesService } from '@/services/challenges.service';
import type { Challenge } from '@/services/challenges.service';

export function DailyChallengeWidget() {
  const t = useTranslations('challenges');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    challengesService.getDailyChallenge().then(setChallenge);
  }, []);

  useEffect(() => {
    if (!challenge) return;
    const updateTimer = () => {
      const diff = new Date(challenge.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [challenge]);

  if (!challenge) return null;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">{t('dailyWidget.title')}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{challenge.title}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <Badge variant="secondary">{challenge.xpReward} XP</Badge>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {timeLeft}
        </span>
      </div>
      <Link href="/challenges" className="mt-3 block">
        <Button size="sm" variant="outline" className="w-full">
          <Trophy className="mr-2 h-3.5 w-3.5" />
          {t('notStarted')}
        </Button>
      </Link>
    </div>
  );
}
