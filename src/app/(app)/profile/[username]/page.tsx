'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Flame,
  Calendar,
  ArrowLeft,
  Trophy,
  Star,
  BookOpen,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MOCK_LEADERBOARD } from '@/services/mock-data';
import { getLevelTitle, XP_CONFIG } from '@/config/constants';

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);

  // Find user in leaderboard
  const entry = MOCK_LEADERBOARD.find(
    (e) => e.username === username
  ) || {
    rank: 42,
    userId: 'unknown',
    username,
    displayName: username,
    avatar: '',
    xp: 1500,
    level: 3,
    streak: 5,
    title: 'Journeyman',
  };

  const levelProgress = XP_CONFIG.levelProgress(entry.xp);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40">
        <div
          className="h-32 relative"
          style={{
            background:
              'linear-gradient(135deg, rgba(153, 69, 255, 0.2), rgba(20, 241, 149, 0.1))',
          }}
        />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 -mt-12 pb-6">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Leaderboard
          </Link>

          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarFallback className="bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white text-3xl font-bold">
                {entry.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{entry.displayName}</h1>
                <Badge
                  variant="outline"
                  className="border-quest-gold/30 text-quest-gold"
                >
                  {entry.title}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-quest-gold" />
                  Rank #{entry.rank}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-quest-gold" />
                  {entry.xp.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Level {entry.level}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {entry.streak} day streak
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Level Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-quest-gold" />
                Level Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold">{entry.level}</p>
                <p className="text-sm text-muted-foreground">
                  {getLevelTitle(entry.level)}
                </p>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {levelProgress}% to Level {entry.level + 1}
              </p>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-quest-purple" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-quest-gold">
                    {entry.xp.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{entry.level}</p>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-orange-500">
                    {entry.streak}
                  </p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">#{entry.rank}</p>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
