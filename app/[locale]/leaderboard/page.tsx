import { userService } from '@/lib/services/user.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XPBadge } from '@/components/gamification/xp-badge';
import { Trophy, Medal, Award, Star, Flame, User as UserIcon, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default async function LeaderboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const topUsers = await userService.getLeaderboard(100);
  const t = await getTranslations('Leaderboard');

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getRankStyles = (rank: number) => {
    if (rank === 1) return 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_20px_rgba(234,179,8,0.1)]';
    if (rank === 2) return 'border-gray-400/50 bg-gray-400/5 shadow-[0_0_20px_rgba(156,163,175,0.1)]';
    if (rank === 3) return 'border-amber-600/50 bg-amber-600/5 shadow-[0_0_20px_rgba(217,119,6,0.1)]';
    return 'border-border/50 bg-card/30';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container py-20 space-y-20">
        {/* Header Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
            <Trophy className="h-3.5 w-3.5" />
            Global Rankings
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            THE <span className="gradient-text">HALL OF FAME</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
            The elite builders and learners of the Solana ecosystem. 
            Keep building, keep earning, keep climbing.
          </p>
        </div>

        {/* Top 3 Podium */}
        {topUsers.length >= 3 && (
          <div className="grid gap-12 md:grid-cols-3 items-end pt-12 max-w-5xl mx-auto px-4">
            {/* 2nd Place */}
            <div className="md:order-1">
              <div className={cn(
                "relative rounded-[2.5rem] border p-8 text-center transition-all duration-500 hover:translate-y-[-8px] group",
                "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              )}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800 border border-white/10 text-zinc-400 shadow-2xl group-hover:scale-110 transition-transform">
                    <Medal className="h-8 w-8" />
                  </div>
                </div>
                <div className="mb-6 flex justify-center pt-4">
                  <div className="relative h-24 w-24 rounded-full border-4 border-zinc-800 p-1.5 bg-zinc-900 overflow-hidden">
                    {(topUsers[1] as any).profiles?.avatar_url ? (
                      <Image src={(topUsers[1] as any).profiles.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-2xl font-black">
                        {(topUsers[1] as any).profiles?.username?.charAt(0).toUpperCase() || 'L'}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-black truncate tracking-tight">{(topUsers[1] as any).profiles?.username || 'Learner'}</h3>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest uppercase text-muted-foreground">
                    Level {(topUsers[1] as any).level}
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black text-white">
                    <Star className="h-5 w-5 fill-white" />
                    <span>{(topUsers[1] as any).total_xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="md:order-2">
              <div className={cn(
                "relative rounded-[3rem] border-2 p-12 text-center transition-all duration-700 hover:translate-y-[-12px] group",
                "border-primary/50 bg-primary/5 shadow-[0_0_50px_rgba(20,241,149,0.1)]"
              )}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary text-primary-foreground shadow-[0_0_40px_rgba(20,241,149,0.4)] group-hover:scale-110 transition-transform">
                    <Trophy className="h-10 w-10" />
                  </div>
                </div>
                <div className="mb-8 flex justify-center pt-4">
                  <div className="relative h-32 w-32 rounded-full border-4 border-primary p-2 bg-zinc-900 overflow-hidden shadow-[0_0_30px_rgba(20,241,149,0.2)]">
                    {(topUsers[0] as any).profiles?.avatar_url ? (
                      <Image src={(topUsers[0] as any).profiles.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-4xl font-black">
                        {(topUsers[0] as any).profiles?.username?.charAt(0).toUpperCase() || 'L'}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-3xl font-black truncate tracking-tighter">{(topUsers[0] as any).profiles?.username || 'Learner'}</h3>
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-[12px] font-black tracking-[0.2em] uppercase">
                    Level {(topUsers[0] as any).level}
                  </div>
                  <div className="flex items-center gap-3 text-3xl font-black text-primary">
                    <Star className="h-8 w-8 fill-primary" />
                    <span>{(topUsers[0] as any).total_xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="md:order-3">
              <div className={cn(
                "relative rounded-[2.5rem] border p-8 text-center transition-all duration-500 hover:translate-y-[-8px] group",
                "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
              )}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-900/40 border border-orange-500/20 text-orange-500 shadow-2xl group-hover:scale-110 transition-transform">
                    <Award className="h-8 w-8" />
                  </div>
                </div>
                <div className="mb-6 flex justify-center pt-4">
                  <div className="relative h-24 w-24 rounded-full border-4 border-zinc-800 p-1.5 bg-zinc-900 overflow-hidden">
                    {(topUsers[2] as any).profiles?.avatar_url ? (
                      <Image src={(topUsers[2] as any).profiles.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-zinc-800 text-2xl font-black">
                        {(topUsers[2] as any).profiles?.username?.charAt(0).toUpperCase() || 'L'}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-black truncate tracking-tight">{(topUsers[2] as any).profiles?.username || 'Learner'}</h3>
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest uppercase text-muted-foreground">
                    Level {(topUsers[2] as any).level}
                  </div>
                  <div className="flex items-center gap-2 text-xl font-black text-white">
                    <Star className="h-5 w-5 fill-white" />
                    <span>{(topUsers[2] as any).total_xp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard List */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between px-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <div className="h-8 w-1.5 bg-primary rounded-full" />
              Top Learners
            </h2>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
              Total Users: {topUsers.length}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            <div className="divide-y divide-white/5">
              {topUsers.length > 0 ? (
                topUsers.map((user: any, index: number) => (
                  <div
                    key={user.user_id}
                    className={cn(
                      "flex items-center gap-4 p-5 md:p-6 transition-all hover:bg-white/[0.05] group",
                      index < 3 && "hidden md:flex" // Hide top 3 on list for desktop as they are on podium
                    )}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-sm border border-white/10 bg-white/5 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                      #{index + 1}
                    </div>
                    
                    <div className="relative h-14 w-14 shrink-0 rounded-full bg-zinc-800 overflow-hidden border-2 border-white/5">
                      {user.profiles?.avatar_url ? (
                        <Image src={user.profiles.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-bold">
                          {user.profiles?.username?.charAt(0).toUpperCase() || 'L'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xl truncate tracking-tight group-hover:text-primary transition-colors">
                        {user.profiles?.username || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Level {user.level}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-white/10" />
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500">
                          <Flame className="h-3 w-3 fill-orange-500" />
                          {user.current_streak} Day Streak
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">Points</span>
                        <div className="flex items-center gap-1.5 font-black text-2xl text-white">
                          <Star className="h-5 w-5 fill-primary text-primary" />
                          {user.total_xp.toLocaleString()}
                        </div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-24 space-y-6">
                  <div className="h-24 w-24 rounded-3xl bg-white/5 flex items-center justify-center mx-auto border border-white/10">
                    <Trophy className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <p className="text-xl font-bold text-muted-foreground">No data available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
