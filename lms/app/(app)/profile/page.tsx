"use client";

import { Zap, Flame, Trophy, BookOpen, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useXP, useLevel, useStreak, useAllProgress, useAchievements, useCourses, useDisplayName, useBio } from "@/lib/hooks/use-service";
import { getXpProgress, formatXP, shortenAddress } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { TRACKS } from "@/types/course";
import Link from "next/link";

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const { data: displayName } = useDisplayName();
  const { data: bio } = useBio();
  const { data: xp = 0 } = useXP();
  const { data: level = 0 } = useLevel();
  const { data: streak } = useStreak();
  const { data: allProgress } = useAllProgress();
  const { data: achievements } = useAchievements();
  const { data: courses } = useCourses();

  const xpProgress = getXpProgress(xp);
  const completedCourses = allProgress?.filter((p) => p.completedAt) ?? [];
  const claimedAchievements = achievements?.filter((a) => a.claimed) ?? [];

  if (!connected || !publicKey) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-4 text-muted-foreground">Connect your wallet to view your profile.</p>
      </div>
    );
  }

  const address = publicKey.toBase58();

  // Calculate track progress
  const trackProgress = Object.entries(TRACKS).map(([id, track]) => {
    const trackCourses = courses?.filter((c) => c.trackId === parseInt(id)) ?? [];
    const completed = completedCourses.filter((p) =>
      trackCourses.some((c) => c.id === p.courseId || c.slug === p.courseId)
    ).length;
    return { ...track, id: parseInt(id), total: trackCourses.length, completed };
  }).filter((t) => t.total > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-gradient-to-br from-[#008c4c] to-[#ffd23f] text-white">
                {(displayName ?? address).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{displayName ?? shortenAddress(address)}</h1>
              {bio && <p className="mt-1 text-muted-foreground">{bio}</p>}
              <p className="text-xs text-muted-foreground mt-1">{address}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <Badge variant="xp" className="text-sm">Level {level}</Badge>
                <span className="flex items-center gap-1 text-sm">
                  <Zap className="h-4 w-4 text-xp-gold" /> {formatXP(xp)} XP
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-streak-orange" /> {streak?.current ?? 0} day streak
                </span>
              </div>
            </div>
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
              Edit Profile
            </Link>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Level {level}</span>
              <span>{xpProgress.current}/{xpProgress.needed} XP to Level {level + 1}</span>
            </div>
            <Progress value={xpProgress.percent} indicatorClassName="bg-gradient-to-r from-[#008c4c] to-[#ffd23f]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Skill Tracks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" /> Skill Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trackProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete courses to build skills.</p>
            ) : (
              trackProgress.map((track) => (
                <div key={track.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{track.display}</span>
                    <span className="text-muted-foreground">{track.completed}/{track.total}</span>
                  </div>
                  <Progress
                    value={track.total > 0 ? (track.completed / track.total) * 100 : 0}
                    indicatorClassName="bg-solana-purple"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" /> Achievements ({claimedAchievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {claimedAchievements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No achievements earned yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {claimedAchievements.map((a) => (
                  <div key={a.id} className="flex flex-col items-center gap-1 rounded-lg bg-muted p-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-solana-purple/10">
                      <Trophy className="h-5 w-5 text-solana-purple" />
                    </div>
                    <p className="text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] text-xp-gold">+{a.xpReward} XP</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completed Courses */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" /> Completed Courses ({completedCourses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses completed yet.</p>
          ) : (
            <div className="space-y-3">
              {completedCourses.map((p) => {
                const course = courses?.find((c) => c.id === p.courseId || c.slug === p.courseId);
                return (
                  <div key={p.courseId} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <div>
                      <p className="text-sm font-medium">{course?.title ?? p.courseId}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed {p.completedAt ? new Date(p.completedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <Badge variant="xp">{course?.xpTotal ?? 0} XP</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
