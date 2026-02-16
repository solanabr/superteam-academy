'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Zap,
  Flame,
  Crown,
  Medal,
  TrendingUp,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MOCK_LEADERBOARD } from '@/services/mock-data';
import { useUserStore } from '@/stores/user-store';
import { XP_CONFIG, getLevelTitle } from '@/config/constants';

const rankColors: Record<number, string> = {
  1: '#F0B90B',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const rankIcons: Record<number, typeof Crown> = {
  1: Crown,
  2: Medal,
  3: Medal,
};

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<string>('alltime');
  const { user, xp, level } = useUserStore();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40 gradient-quest">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F0B90B] to-[#FF6B35] flex items-center justify-center">
                <Trophy className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Hall of Champions
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The greatest Solana builders ranked by XP. Climb the ranks by
              completing quests and earning achievements.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map((podiumIndex) => {
            const entry = MOCK_LEADERBOARD[podiumIndex];
            if (!entry) return null;
            const isFirst = podiumIndex === 0;
            const color = rankColors[entry.rank] || '#888';
            const RankIcon = rankIcons[entry.rank] || Medal;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: podiumIndex * 0.15 }}
                className={`${isFirst ? 'order-1 sm:-mt-4' : podiumIndex === 2 ? 'order-2' : 'order-0'}`}
              >
                <Card
                  className={`border-border/50 text-center ${
                    isFirst ? 'glow-gold' : ''
                  }`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="relative inline-block mb-3">
                      <Avatar
                        className="h-16 w-16 mx-auto"
                        style={{
                          border: `3px solid ${color}`,
                        }}
                      >
                        <AvatarFallback className="text-lg font-bold bg-muted">
                          {entry.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {entry.rank}
                      </div>
                    </div>
                    <p className="font-bold text-sm truncate">{entry.displayName}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {getLevelTitle(entry.level)}
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-4 w-4 text-quest-gold" />
                      <span className="font-bold text-quest-gold">
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span>Lv.{entry.level}</span>
                      <span className="flex items-center gap-0.5">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {entry.streak}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Full Rankings */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {MOCK_LEADERBOARD.map((entry, index) => {
                const isCurrentUser = user && entry.userId === user.id;
                const color = rankColors[entry.rank];

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors ${
                      isCurrentUser ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={
                        color
                          ? { backgroundColor: `${color}20`, color }
                          : undefined
                      }
                    >
                      {entry.rank <= 3 ? (
                        <span style={{ color }}>{entry.rank}</span>
                      ) : (
                        <span className="text-muted-foreground">{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-muted text-sm font-bold">
                          {entry.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {entry.displayName}
                          {isCurrentUser && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] text-primary border-primary/30"
                            >
                              You
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.title} &bull; Level {entry.level}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-sm">{entry.streak}</span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Zap className="h-4 w-4 text-quest-gold" />
                      <span className="font-bold text-sm">
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
