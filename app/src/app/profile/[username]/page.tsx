"use client";

import { useParams } from "next/navigation";
import { useLocale } from "@/contexts/locale-context";
import { useLearning } from "@/contexts/learning-context";
import { COURSES } from "@/services/course-data";
import { calculateLevel, xpProgressInLevel, xpForLevel } from "@/config/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Award,
  BookOpen,
  Trophy,
  Globe,
  Github,
  Twitter,
  Calendar,
  Shield,
  Code2,
} from "lucide-react";

const SKILL_CATEGORIES = [
  { name: "Solana Core", icon: Shield, score: 78, max: 100 },
  { name: "Rust", icon: Code2, score: 65, max: 100 },
  { name: "Anchor", icon: BookOpen, score: 52, max: 100 },
  { name: "DeFi", icon: Zap, score: 30, max: 100 },
  { name: "NFTs", icon: Award, score: 45, max: 100 },
  { name: "Security", icon: Shield, score: 20, max: 100 },
];

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { t } = useLocale();
  const { xp, progress, credentials } = useLearning();

  const level = calculateLevel(xp);
  const levelProgress = xpProgressInLevel(xp);
  const completedCourses = COURSES.filter((c) => {
    const p = progress.get(c.id);
    return p?.completedAt !== null && p?.completedAt !== undefined;
  });

  const displayName = username || "Learner";
  const shortWallet = `${username.slice(0, 4)}...${username.slice(-4)}`;

  return (
    <div className="animate-fade-in">
      {/* Profile Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-24 w-24 border-4 border-violet-500/20">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-2xl font-bold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {shortWallet}
              </p>
              <p className="mt-2 max-w-md text-muted-foreground">
                Solana developer and builder. Learning on-chain development with
                Superteam Academy.
              </p>

              <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">
                  <Zap className="mr-1 h-3 w-3" />
                  {xp.toLocaleString()} XP
                </Badge>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <Trophy className="mr-1 h-3 w-3" />
                  Level {level}
                </Badge>
                <Badge variant="outline">
                  <Award className="mr-1 h-3 w-3" />
                  {credentials.length} Credentials
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-center gap-3 sm:justify-start">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {t("profile.memberSince", { date: "January 2026" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column: Skills radar */}
          <div className="lg:col-span-1">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <h2 className="text-lg font-semibold">
                  {t("profile.skills")}
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {SKILL_CATEGORIES.map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <skill.icon className="h-4 w-4 text-violet-500" />
                        {skill.name}
                      </span>
                      <span className="text-muted-foreground">
                        {skill.score}%
                      </span>
                    </div>
                    <Progress value={skill.score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card className="mt-4 border-border/40">
              <CardContent className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Level {level}</span>
                  <span className="text-sm text-muted-foreground">
                    Level {level + 1}
                  </span>
                </div>
                <Progress value={levelProgress} className="h-2" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {xpForLevel(level + 1) - xp} XP to next level
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-8">
            {/* On-Chain Credentials */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                {t("profile.credentials")}
              </h2>
              {credentials.length === 0 ? (
                <Card className="border-border/40">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t("profile.noCredentials")}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {credentials.map((cred) => (
                    <Card key={cred.assetId} className="border-border/40 overflow-hidden">
                      <div className="h-24 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                        <Award className="h-10 w-10 text-violet-500/50" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{cred.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {cred.coursesCompleted} courses &middot;{" "}
                          {cred.totalXp} XP
                        </p>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                          {cred.mintAddress}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Completed Courses */}
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                {t("profile.completedCourses")}
              </h2>
              {completedCourses.length === 0 ? (
                <Card className="border-border/40">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    {t("profile.noCourses")}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {completedCourses.map((course) => (
                    <Card key={course.id} className="border-border/40">
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <BookOpen className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">
                            {course.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {course.lessonCount * course.xpPerLesson} XP earned
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
