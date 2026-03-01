'use client';

import { Coins, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CourseReward {
  courseId: string;
  courseTitle: string;
  totalXp: number;
  pendingXp: number;
  claimedXp: number;
}

const MOCK_REWARDS: CourseReward[] = [
  {
    courseId: 'solana-101',
    courseTitle: 'Solana 101: From Zero to Hero',
    totalXp: 12400,
    pendingXp: 1800,
    claimedXp: 10600,
  },
  {
    courseId: 'anchor-deep-dive',
    courseTitle: 'Anchor Framework Deep Dive',
    totalXp: 6800,
    pendingXp: 950,
    claimedXp: 5850,
  },
];

interface CreatorRewardsProps {
  className?: string;
}

export function CreatorRewards({ className }: CreatorRewardsProps) {
  const totalXp = MOCK_REWARDS.reduce((s, r) => s + r.totalXp, 0);
  const totalPending = MOCK_REWARDS.reduce((s, r) => s + r.pendingXp, 0);
  const totalClaimed = MOCK_REWARDS.reduce((s, r) => s + r.claimedXp, 0);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center gap-2">
          <Coins className="size-4 text-amber-500" />
          <CardTitle className="text-base">Creator Rewards</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Info banner */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Creator rewards are minted when learners complete your courses.
          You earn a percentage of the XP awarded to each learner.
        </p>

        {/* Totals row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Zap className="size-3 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="mt-1 text-lg font-bold">{totalXp.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Claimed</span>
            </div>
            <p className="mt-1 text-lg font-bold">{totalClaimed.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="size-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="mt-1 text-lg font-bold">{totalPending.toLocaleString()}</p>
          </div>
        </div>

        {/* Per-course breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Per Course
          </h4>
          {MOCK_REWARDS.map((reward) => (
            <div
              key={reward.courseId}
              className="flex items-center justify-between rounded-lg border px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{reward.courseTitle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <CheckCircle2 className="size-2.5" />
                    {reward.claimedXp.toLocaleString()} claimed
                  </Badge>
                  {reward.pendingXp > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-[10px] border-amber-500/25 text-amber-600 dark:text-amber-400"
                    >
                      <Clock className="size-2.5" />
                      {reward.pendingXp.toLocaleString()} pending
                    </Badge>
                  )}
                </div>
              </div>
              <div className="ml-3 text-right">
                <p className="text-sm font-bold">{reward.totalXp.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">XP total</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
