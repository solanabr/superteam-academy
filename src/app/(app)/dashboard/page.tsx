'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Flame,
  Trophy,
  BookOpen,
  ArrowRight,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  Target,
  Award,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/stores/user-store';
import { MOCK_COURSES, MOCK_PROGRESS, MOCK_GAMIFICATION_PROFILE } from '@/services/mock-data';
import { TRACK_INFO, XP_CONFIG, getLevelTitle, DIFFICULTY_CONFIG } from '@/config/constants';
import { StreakCalendar } from '@/components/gamification/streak-calendar';

export default function DashboardPage() {
  const { user, isAuthenticated, xp, level, profile, initDemoUser } =
    useUserStore();

  const effectiveProfile = profile || MOCK_GAMIFICATION_PROFILE;
  const effectiveXP = xp || effectiveProfile.xp;
  const effectiveLevel = level || effectiveProfile.level;
  const levelProgress = XP_CONFIG.levelProgress(effectiveXP);
  const nextLevelXP = XP_CONFIG.xpForLevel(effectiveLevel + 1);

  // Get enrolled courses
  const enrolledCourses = useMemo(() => {
    return Object.entries(MOCK_PROGRESS).map(([courseId, progress]) => {
      const course = MOCK_COURSES.find((c) => c.id === courseId);
      return { course, progress };
    }).filter((e) => e.course);
  }, []);

  // If not authenticated, show prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Begin Your Quest</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet or sign in to track your progress, earn XP, and
              collect on-chain credentials.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full gap-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90 border-0"
                onClick={initDemoUser}
              >
                <Zap className="h-4 w-4" />
                Try Demo Mode
              </Button>
              <Link href="/courses">
                <Button variant="outline" className="w-full gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Quests
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b border-border/40 gradient-quest">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Avatar className="h-16 w-16 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-[#9945FF] to-[#14F195] text-white text-xl font-bold">
                {user?.displayName?.charAt(0) || 'Q'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.displayName || 'Quest Hero'}
              </h1>
              <p className="text-muted-foreground">
                {getLevelTitle(effectiveLevel)} &bull; Level {effectiveLevel} &bull;
                Rank #{effectiveProfile.rank}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-quest-gold" />
                    <span className="text-xs text-muted-foreground">Total XP</span>
                  </div>
                  <p className="text-2xl font-bold">{effectiveXP.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-quest-purple" />
                    <span className="text-xs text-muted-foreground">Level</span>
                  </div>
                  <p className="text-2xl font-bold">{effectiveLevel}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {effectiveProfile.streak.currentStreak}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-quest-gold" />
                    <span className="text-xs text-muted-foreground">Rank</span>
                  </div>
                  <p className="text-2xl font-bold">#{effectiveProfile.rank}</p>
                </CardContent>
              </Card>
            </div>

            {/* Level Progress */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-quest-gold" />
                    <span className="font-medium">Level {effectiveLevel} Progress</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {effectiveXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{getLevelTitle(effectiveLevel)}</span>
                  <span>{getLevelTitle(effectiveLevel + 1)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Active Quests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Active Quests</h2>
                <Link href="/courses">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Browse All
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {enrolledCourses.map(({ course, progress }) => {
                  if (!course) return null;
                  const trackInfo = TRACK_INFO[course.track];
                  const diffConfig = DIFFICULTY_CONFIG[course.difficulty];
                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`}>
                      <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${trackInfo.color}20, ${trackInfo.color}08)`,
                              }}
                            >
                              {trackInfo.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-sm truncate">
                                  {course.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] flex-shrink-0"
                                  style={{ color: diffConfig.color, borderColor: `${diffConfig.color}30` }}
                                >
                                  {diffConfig.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <Progress
                                  value={progress.completionPercentage}
                                  className="h-2 flex-1"
                                />
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {progress.completionPercentage}%
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {progress.completedLessons.length} of{' '}
                                {progress.totalLessons} lessons &bull;{' '}
                                <span className="text-quest-gold">
                                  {progress.xpEarned} XP earned
                                </span>
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recommended Courses */}
            <div>
              <h2 className="text-lg font-bold mb-4">Recommended Quests</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {MOCK_COURSES.filter(
                  (c) => !Object.keys(MOCK_PROGRESS).includes(c.id)
                )
                  .slice(0, 2)
                  .map((course) => {
                    const trackInfo = TRACK_INFO[course.track];
                    return (
                      <Link key={course.id} href={`/courses/${course.slug}`}>
                        <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer h-full">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span>{trackInfo.icon}</span>
                              <span className="text-xs text-muted-foreground">
                                {trackInfo.name}
                              </span>
                            </div>
                            <h3 className="font-medium text-sm mb-1">
                              {course.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                              {course.shortDescription}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3 text-quest-gold" />
                                {course.totalXP} XP
                              </span>
                              <span>&bull;</span>
                              <span>{course.duration}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Calendar */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StreakCalendar
                  streakDays={effectiveProfile.streak.currentStreak}
                  streakHistory={effectiveProfile.streak.streakHistory}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                  <span>
                    Best: {effectiveProfile.streak.longestStreak} days
                  </span>
                  {effectiveProfile.streak.hasFreezeAvailable && (
                    <Badge variant="outline" className="text-[10px]">
                      Freeze Available
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-quest-purple" />
                    Achievements
                  </CardTitle>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {effectiveProfile.achievements.slice(0, 4).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="aspect-square rounded-lg bg-muted flex items-center justify-center text-xl border border-border/50 hover:scale-105 transition-transform cursor-pointer"
                      title={achievement.name}
                    >
                      {achievement.icon}
                    </div>
                  ))}
                  {effectiveProfile.achievements.length < 4 &&
                    Array.from(
                      { length: 4 - effectiveProfile.achievements.length },
                      (_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="aspect-square rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-border/50"
                        >
                          <span className="text-xs text-muted-foreground">?</span>
                        </div>
                      )
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {effectiveProfile.achievements.length} of 256 achievements
                  unlocked
                </p>
              </CardContent>
            </Card>

            {/* Skill Progress */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-quest-cyan" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {effectiveProfile.skills
                    .filter((s) => s.isUnlocked)
                    .map((skill) => {
                      const trackInfo = TRACK_INFO[skill.track];
                      const progress = skill.xpRequired > 0
                        ? Math.round((skill.xp / skill.xpRequired) * 100)
                        : 0;
                      return (
                        <div key={skill.id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <span className="text-xs">{trackInfo.icon}</span>
                              {skill.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Lv.{skill.level}/{skill.maxLevel}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
