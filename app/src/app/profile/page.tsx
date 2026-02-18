"use client";

import { MOCK_LEARNER, COURSES } from "@/data/mock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatsCard } from "@/components/profile/stats-card";
import { AchievementGrid } from "@/components/profile/achievement-grid";
import {
  getLevel,
  xpProgress,
  xpForLevel,
  formatXP,
  shortenAddress,
} from "@/lib/utils";
import {
  Zap,
  Flame,
  BookOpen,
  GraduationCap,
  Calendar,
  Shield,
  Copy,
  ExternalLink,
  Snowflake,
  TrendingUp,
} from "lucide-react";
export default function ProfilePage() {
  const learner = MOCK_LEARNER;
  const level = getLevel(learner.xp);
  const progress = xpProgress(learner.xp);
  const nextLevelXp = xpForLevel(level + 1);

  // Mock enrolled courses
  const enrolledCourses = COURSES.slice(0, 3);

  return (
    <div className="container py-8 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-solana-purple to-solana-green flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
          {learner.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{learner.displayName}</h1>
            <Badge variant="secondary" className="font-mono">
              Level {level}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{shortenAddress(learner.address, 6)}</span>
            <button
              className="hover:text-foreground transition-colors"
              onClick={() => navigator.clipboard.writeText(learner.address)}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <a
              href={`https://explorer.solana.com/address/${learner.address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Joined {new Date(learner.joinedAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* XP Progress */}
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="gradient-text font-bold text-lg">
                {formatXP(learner.xp)} XP
              </span>
              <span className="text-muted-foreground text-xs">
                {formatXP(nextLevelXp)} XP for Level {level + 1}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Current Streak"
          value={`${learner.currentStreak} days`}
          subtitle={`Longest: ${learner.longestStreak} days`}
          icon={Flame}
          iconColor="text-orange-400"
          trend={{ value: 3, label: "this week" }}
        />
        <StatsCard
          title="XP This Season"
          value={formatXP(learner.xp)}
          subtitle="Season 1"
          icon={Zap}
          iconColor="text-solana-green"
          trend={{ value: 450, label: "this week" }}
        />
        <StatsCard
          title="Courses"
          value={learner.coursesCompleted}
          subtitle={`${learner.lessonsCompleted} lessons total`}
          icon={GraduationCap}
          iconColor="text-solana-purple"
        />
        <StatsCard
          title="Streak Freezes"
          value={learner.streakFreezes}
          subtitle="Available"
          icon={Snowflake}
          iconColor="text-solana-blue"
        />
      </div>

      {/* Achievements */}
      <AchievementGrid unlockedIds={learner.achievements} />

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Enrolled Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrolledCourses.map((course, idx) => {
              const isCompleted = idx < 2;
              const lessonsDone = isCompleted
                ? course.lessonCount
                : Math.floor(course.lessonCount * 0.4);
              const pct = Math.round(
                (lessonsDone / course.lessonCount) * 100
              );

              return (
                <div
                  key={course.slug}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br ${course.thumbnailGradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {course.title}
                      </h3>
                      {isCompleted && (
                        <Badge variant="default" className="bg-solana-green text-black text-[10px]">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {lessonsDone}/{course.lessonCount}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium gradient-text">
                      {formatXP(
                        isCompleted
                          ? course.xpTotal
                          : Math.round(course.xpTotal * 0.4)
                      )}{" "}
                      XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-solana-purple" />
            Credentials
            <Badge variant="secondary" className="text-xs">ZK Compressed</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                track: "Anchor Framework",
                level: "Beginner",
                levelNum: 1,
                coursesCompleted: 1,
                xpEarned: 500,
                gradient: "from-solana-purple to-indigo-600",
              },
              {
                track: "Rust for Solana",
                level: "Beginner",
                levelNum: 1,
                coursesCompleted: 1,
                xpEarned: 600,
                gradient: "from-orange-500 to-red-600",
              },
            ].map((cred) => (
              <div
                key={cred.track}
                className="relative rounded-lg border overflow-hidden"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${cred.gradient}`}
                />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{cred.track}</h3>
                    <Badge variant="secondary">Lv.{cred.levelNum}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cred.level} | {cred.coursesCompleted} course
                    {cred.coursesCompleted !== 1 ? "s" : ""} | {formatXP(cred.xpEarned)} XP
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-solana-green" />
                    Upgrades with track progression
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
