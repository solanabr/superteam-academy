import { userService } from '@/lib/services/user.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XPBadge } from '@/components/gamification/xp-badge';
import { Trophy, Medal, Award } from 'lucide-react';

export default async function LeaderboardPage() {
  const topUsers = await userService.getLeaderboard(100);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/20';
    if (rank === 3) return 'bg-amber-600/10 text-amber-600 border-amber-600/20';
    return 'bg-muted';
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top learners in the Superteam Academy community</p>
      </div>

      {/* Top 3 Podium */}
      {topUsers.length >= 3 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {/* 2nd Place */}
          <Card className="md:order-1 md:mt-8">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${getRankBadge(2)}`}>
                  {getRankIcon(2)}
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{(topUsers[1] as any).username || 'Anonymous'}</p>
              <XPBadge 
                xp={(topUsers[1] as any).total_xp} 
                level={(topUsers[1] as any).level} 
                showLevel 
                className="justify-center"
              />
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="md:order-2 border-primary">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${getRankBadge(1)}`}>
                  {getRankIcon(1)}
                </div>
              </div>
              <p className="text-3xl font-bold mb-1">{(topUsers[0] as any).username || 'Anonymous'}</p>
              <XPBadge 
                xp={(topUsers[0] as any).total_xp} 
                level={(topUsers[0] as any).level} 
                showLevel 
                className="justify-center"
              />
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="md:order-3 md:mt-8">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${getRankBadge(3)}`}>
                  {getRankIcon(3)}
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{(topUsers[2] as any).username || 'Anonymous'}</p>
              <XPBadge 
                xp={(topUsers[2] as any).total_xp} 
                level={(topUsers[2] as any).level} 
                showLevel 
                className="justify-center"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {topUsers.length > 0 ? (
              topUsers.map((user: any, index: number) => (
                <div
                  key={user.user_id}
                  className={`flex items-center gap-4 p-4 ${index < 3 ? 'bg-muted/50' : ''}`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getRankBadge(index + 1)}`}>
                    {getRankIcon(index + 1) || (
                      <span className="font-bold text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {user.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Level {user.level} • {user.current_streak} day streak
                    </p>
                  </div>
                  <XPBadge xp={user.total_xp} />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No users on the leaderboard yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
