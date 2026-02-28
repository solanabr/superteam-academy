'use client';

import { Zap, Calendar } from 'lucide-react';
import { DailyChallengeCard } from '@/components/challenges/daily-challenge-card';
import { PastChallenges } from '@/components/challenges/past-challenges';
import { SpeedLeaderboard } from '@/components/challenges/speed-leaderboard';

const TODAY_CHALLENGE = {
  title: 'Implement a Vault Withdraw Instruction',
  description:
    'Build a withdraw instruction for a Solana vault program using Anchor. The instruction must validate the signer is the vault owner, check sufficient balance, and transfer SOL from the vault PDA back to the owner. All five test cases must pass.',
  difficulty: 'intermediate' as const,
  xpReward: 150,
};

export default function ChallengesPage() {
  // In production, this would check if the user has already attempted today's challenge
  const hasAttemptedToday = false;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Daily Challenges</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Test your skills with a new coding challenge every day. One attempt per day -- make it count.
        </p>
      </div>

      {/* Rules banner */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <Calendar className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">How it works</p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li>A new challenge drops every day at 00:00 UTC</li>
            <li>You get exactly 1 attempt per challenge -- no retries</li>
            <li>Earn XP based on difficulty and speed</li>
            <li>Compete on the speed leaderboard for bragging rights</li>
          </ul>
        </div>
      </div>

      {/* Today's Challenge */}
      <DailyChallengeCard
        title={TODAY_CHALLENGE.title}
        description={TODAY_CHALLENGE.description}
        difficulty={TODAY_CHALLENGE.difficulty}
        xpReward={TODAY_CHALLENGE.xpReward}
        hasAttemptedToday={hasAttemptedToday}
      />

      {/* Two-column layout: past challenges + speed leaderboard */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <PastChallenges />
        <SpeedLeaderboard />
      </div>
    </div>
  );
}
