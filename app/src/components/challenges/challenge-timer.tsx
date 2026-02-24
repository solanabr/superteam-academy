'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChallengeTimerProps {
  className?: string;
}

function getTimeUntilMidnightUTC(): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const now = new Date();
  const midnightUTC = new Date(now);
  midnightUTC.setUTCDate(midnightUTC.getUTCDate() + 1);
  midnightUTC.setUTCHours(0, 0, 0, 0);

  const totalMs = midnightUTC.getTime() - now.getTime();
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalMs };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function ChallengeTimer({ className }: ChallengeTimerProps) {
  const [time, setTime] = useState(getTimeUntilMidnightUTC);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeUntilMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Clock className="size-4" />
      <span>New challenge in</span>
      <span className="font-mono font-semibold text-foreground tabular-nums">
        {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
      </span>
    </div>
  );
}
