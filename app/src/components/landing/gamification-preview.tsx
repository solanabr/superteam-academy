'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Flame,
  Shield,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { getLevelTitle, xpProgressPercent, xpForLevel, calculateLevel } from '@/lib/solana/xp';

const MOCK_XP = 2_450;
const MOCK_LEVEL = calculateLevel(MOCK_XP);
const MOCK_PROGRESS = xpProgressPercent(MOCK_XP);
const MOCK_NEXT_LEVEL_XP = xpForLevel(MOCK_LEVEL + 1);

interface AchievementBadge {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  earned: boolean;
}

const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    title: 'First Lesson',
    description: 'Complete your first lesson',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    earned: true,
  },
  {
    title: 'Week Warrior',
    description: '7-day learning streak',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    earned: true,
  },
  {
    title: 'DeFi Builder',
    description: 'Complete the DeFi track',
    icon: Trophy,
    color: 'text-primary',
    bg: 'bg-primary/10',
    earned: true,
  },
  {
    title: 'Bug Hunter',
    description: 'Find 5 vulnerabilities',
    icon: Shield,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    earned: false,
  },
];

export function GamificationPreview() {
  const t = useTranslations('landing');

  return (
    <section
      className="relative overflow-hidden bg-muted/30 py-16 md:py-24"
      aria-labelledby="gamification-heading"
    >
      {/* Background accent */}
      <div className="absolute -right-48 top-1/2 -z-10 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/5 blur-[128px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Gamified Learning
          </Badge>
          <h2
            id="gamification-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {t('gamification_title')}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Every lesson completed earns you soulbound XP tokens. Level up,
            unlock achievements, and mint verifiable credential NFTs.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Left column: XP + Level + Streak */}
          <div className="flex flex-col gap-6">
            {/* XP Progress card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{MOCK_XP.toLocaleString()} XP</p>
                      <p className="text-sm text-muted-foreground">
                        {MOCK_NEXT_LEVEL_XP.toLocaleString()} XP to next level
                      </p>
                    </div>
                  </div>
                  {/* Level badge */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                      {MOCK_LEVEL}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {getLevelTitle(MOCK_LEVEL)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={MOCK_PROGRESS} className="h-3" />
                  <p className="mt-1.5 text-right text-xs text-muted-foreground">
                    {Math.round(MOCK_PROGRESS)}% to Level {MOCK_LEVEL + 1}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Streak counter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-sm text-muted-foreground">day streak</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keep learning daily to maintain your streak
                    </p>
                  </div>
                  {/* Streak calendar mini */}
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-6 w-2 rounded-full ${
                          i < 5
                            ? 'bg-accent'
                            : i === 5
                              ? 'bg-accent/50'
                              : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credential NFT mockup */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary via-primary/80 to-accent p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-white/70">
                      Superteam Academy
                    </p>
                    <p className="mt-1 text-lg font-bold text-white">
                      Solana Core Credential
                    </p>
                    <p className="mt-0.5 text-xs text-white/60">
                      Issued on Solana Devnet
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-white/40" />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/20" />
                  <div>
                    <p className="text-xs text-white/70">Earned by</p>
                    <p className="font-mono text-xs text-white/90">
                      7xKt...3mRe
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Soulbound NFT</span>
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <Shield className="h-2.5 w-2.5" />
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Achievement badges */}
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-semibold">Achievement Badges</h3>
            <div className="grid grid-cols-2 gap-4">
              {ACHIEVEMENT_BADGES.map((badge) => (
                <Card
                  key={badge.title}
                  className={`transition-opacity ${!badge.earned ? 'opacity-50' : ''}`}
                >
                  <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${badge.bg}`}
                    >
                      <badge.icon className={`h-7 w-7 ${badge.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{badge.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {badge.description}
                      </p>
                    </div>
                    {badge.earned ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Earned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Locked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mini leaderboard preview */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4 text-sm font-semibold">Top Learners</h3>
                <div className="flex flex-col gap-3">
                  {[
                    { rank: 1, name: '9kYt...4dRe', xp: '15,400', level: 12 },
                    { rank: 2, name: '3mBf...7nLs', xp: '12,800', level: 11 },
                    { rank: 3, name: '7xKt...3mRe', xp: '9,200', level: 9 },
                  ].map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          entry.rank === 1
                            ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                            : entry.rank === 2
                              ? 'bg-gray-300/20 text-gray-600 dark:text-gray-300'
                              : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <span className="flex-1 font-mono text-sm">
                        {entry.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Lv.{entry.level}
                      </span>
                      <span className="text-sm font-medium">{entry.xp} XP</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
