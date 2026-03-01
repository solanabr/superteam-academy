'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChallengeTimer } from '@/components/challenges/challenge-timer';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface DailyChallengeCardProps {
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  hasAttemptedToday: boolean;
  className?: string;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  advanced: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
};

export function DailyChallengeCard({
  title,
  description,
  difficulty,
  xpReward,
  hasAttemptedToday,
  className,
}: DailyChallengeCardProps) {
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  const handleStart = useCallback(() => {
    setIsStarting(true);
    // Navigate to the first available course challenge page.
    // In production, this would link to a challenge-specific route
    // using the challenge ID from the CMS.
    router.push('/courses/intro-to-solana/challenge');
  }, [router]);

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
        className,
      )}
    >
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 size-32 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-2xl" />

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
              <Zap className="size-4 text-primary" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Daily Challenge
            </span>
          </div>
          <Badge variant="outline" className={cn(DIFFICULTY_STYLES[difficulty])}>
            {difficulty}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-xl">{title}</CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="mt-4 flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Zap className="size-3" />
            {xpReward} XP
          </Badge>
          <span className="text-xs text-muted-foreground">1 attempt per day</span>
        </div>
      </CardContent>

      <CardFooter className="relative flex items-center justify-between">
        {hasAttemptedToday ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <span>Already attempted today</span>
          </div>
        ) : (
          <Button onClick={handleStart} disabled={isStarting} className="gap-2">
            {isStarting ? (
              <>
                <Lock className="size-4 animate-pulse" />
                Loading...
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Start Challenge
              </>
            )}
          </Button>
        )}
        <ChallengeTimer />
      </CardFooter>
    </Card>
  );
}
