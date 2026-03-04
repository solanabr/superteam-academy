// app/leaderboard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProgressService, getAnalyticsService } from '@/lib/services';
import { LeaderboardEntry } from '@/lib/types/domain';
import { formatXP, truncateAddress } from '@/lib/utils';

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track page view
    const analytics = getAnalyticsService();
    analytics.pageView('/leaderboard', 'Leaderboard');

    async function loadLeaderboard() {
      try {
        const progressService = getProgressService();
        const data = await progressService.getLeaderboard('alltime');
        setLeaderboard(data as any);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="container flex min-h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentUserId = publicKey?.toBase58();
  const userEntry = leaderboard.find(entry => entry.userId === currentUserId);

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you rank against other developers
        </p>
      </div>

      {/* User's Rank */}
      {userEntry && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg">Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10">
                  {getRankIcon(userEntry.rank)}
                </div>
                <div>
                  <div className="font-semibold">{userEntry.username}</div>
                  <div className="text-sm text-muted-foreground">
                    Level {userEntry.level}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{formatXP(userEntry.totalXp)} XP</div>
                <div className="text-sm text-muted-foreground">
                  {userEntry.achievements} achievements
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Developers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;
              
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isCurrentUser ? 'bg-primary/10 border border-primary' : 'border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {entry.username || truncateAddress(entry.userId)}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {entry.level} • {entry.completedCourses} courses
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatXP(entry.totalXp)} XP</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.achievements} achievements
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
