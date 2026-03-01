'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type ChallengeResult = 'passed' | 'failed' | 'not_attempted';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type FilterOption = 'all' | 'completed' | 'missed';

interface PastChallenge {
  id: string;
  date: string;
  title: string;
  difficulty: Difficulty;
  result: ChallengeResult;
  timeTaken?: number; // seconds, if attempted
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  beginner: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  intermediate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  advanced: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
};

const RESULT_CONFIG: Record<ChallengeResult, {
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = {
  passed: {
    label: 'Passed',
    icon: CheckCircle2,
    className: 'text-emerald-500',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'text-red-500',
  },
  not_attempted: {
    label: 'Missed',
    icon: MinusCircle,
    className: 'text-muted-foreground',
  },
};

const MOCK_PAST_CHALLENGES: PastChallenge[] = [
  {
    id: 'dc-7',
    date: '2026-02-23',
    title: 'Build a Token Swap CPI',
    difficulty: 'advanced',
    result: 'passed',
    timeTaken: 1243,
  },
  {
    id: 'dc-6',
    date: '2026-02-22',
    title: 'PDA Seed Derivation',
    difficulty: 'intermediate',
    result: 'passed',
    timeTaken: 845,
  },
  {
    id: 'dc-5',
    date: '2026-02-21',
    title: 'Anchor Error Handling',
    difficulty: 'intermediate',
    result: 'failed',
    timeTaken: 1800,
  },
  {
    id: 'dc-4',
    date: '2026-02-20',
    title: 'SPL Token Transfer',
    difficulty: 'beginner',
    result: 'not_attempted',
  },
  {
    id: 'dc-3',
    date: '2026-02-19',
    title: 'Account Constraints',
    difficulty: 'intermediate',
    result: 'passed',
    timeTaken: 622,
  },
  {
    id: 'dc-2',
    date: '2026-02-18',
    title: 'Hello Solana Program',
    difficulty: 'beginner',
    result: 'passed',
    timeTaken: 312,
  },
  {
    id: 'dc-1',
    date: '2026-02-17',
    title: 'Keypair Generation',
    difficulty: 'beginner',
    result: 'not_attempted',
  },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

interface PastChallengesProps {
  className?: string;
}

export function PastChallenges({ className }: PastChallengesProps) {
  const [filter, setFilter] = useState<FilterOption>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_PAST_CHALLENGES;
    if (filter === 'completed') {
      return MOCK_PAST_CHALLENGES.filter((c) => c.result === 'passed');
    }
    // 'missed' = failed + not_attempted
    return MOCK_PAST_CHALLENGES.filter(
      (c) => c.result === 'failed' || c.result === 'not_attempted',
    );
  }, [filter]);

  const filters: { key: FilterOption; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'missed', label: 'Missed' },
  ];

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Past Challenges</CardTitle>
          <div className="flex items-center gap-1">
            <Filter className="mr-1 size-3.5 text-muted-foreground" />
            {filters.map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No challenges match this filter
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((challenge) => {
              const resultConfig = RESULT_CONFIG[challenge.result];
              const ResultIcon = resultConfig.icon;

              return (
                <div
                  key={challenge.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <ResultIcon
                    className={cn('size-4 shrink-0', resultConfig.className)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{challenge.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(challenge.date)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0', DIFFICULTY_STYLES[challenge.difficulty])}
                  >
                    {challenge.difficulty}
                  </Badge>
                  <div className="w-16 text-right">
                    {challenge.timeTaken ? (
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatTime(challenge.timeTaken)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'w-16 text-right text-xs font-medium',
                      resultConfig.className,
                    )}
                  >
                    {resultConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
