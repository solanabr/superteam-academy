"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth";
import { XPDisplay, StreakBadge } from "@/components/shared";
import {
  AchievementCard,
  LevelRing,
  StreakCalendar,
  SkillRadar,
} from "@/components/gamification";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAllProgress,
  useXP,
  useStreak,
  useAchievements,
  useCredentials,
} from "@/hooks/use-services";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Settings,
  Award,
  Trophy,
  BookOpen,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ACHIEVEMENTS_PER_PAGE = 9;

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { profile } = useAuth();
  const { balance } = useXP();
  const { streak } = useStreak();
  const { progressList } = useAllProgress();
  const { achievements } = useAchievements();
  const { credentials } = useCredentials();

  const completed = progressList.filter((p) => p.isCompleted);
  const earnedAchievements = achievements.filter((a) => a.isEarned);

  // Sort: earned first, then unearned
  const sortedAchievements = [...achievements].sort((a, b) => {
    if (a.isEarned && !b.isEarned) return -1;
    if (!a.isEarned && b.isEarned) return 1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedAchievements.length / ACHIEVEMENTS_PER_PAGE));
  const [achPage, setAchPage] = useState(0);
  const pagedAchievements = sortedAchievements.slice(
    achPage * ACHIEVEMENTS_PER_PAGE,
    (achPage + 1) * ACHIEVEMENTS_PER_PAGE
  );

  return (
    <ProtectedRoute>
      <PlatformLayout>
        <div className="container mx-auto px-4 py-8 lg:py-12">
          {/* Profile header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.displayName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {profile?.displayName ?? "Learner"}
                </h1>
                <Badge variant="secondary" className="text-xs gap-1">
                  <Zap className="h-3 w-3" />
                  Level {balance.level}
                </Badge>
                <StreakBadge streak={streak.currentStreak} />
              </div>
              <p className="text-sm text-muted-foreground">
                @{profile?.username}
              </p>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground max-w-lg">
                  {profile.bio}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t("memberSince")}{" "}
                  {profile?.joinedAt
                    ? new Date(profile.joinedAt).toLocaleDateString()
                    : "—"}
                </span>
                {profile?.walletAddress && (
                  <span className="flex items-center gap-1 font-mono">
                    {profile.walletAddress.slice(0, 4)}...
                    {profile.walletAddress.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                {t("editProfile")}
              </Link>
            </Button>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{balance.amount}</p>
              <p className="text-xs text-muted-foreground">{t("totalXp")}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-2">
              <LevelRing xp={balance.amount} size={48} />
              <p className="text-xs text-muted-foreground">{t("level")}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{streak.currentStreak}</p>
              <p className="text-xs text-muted-foreground">{t("streak")}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold">{completed.length}</p>
              <p className="text-xs text-muted-foreground">
                {t("completedCourses")}
              </p>
            </div>
          </div>

          <XPDisplay xp={balance.amount} showProgress />

          {/* Streak Calendar + Skill Radar */}
          <div className="grid gap-4 lg:grid-cols-2 my-8">
            <div className="rounded-xl border bg-card p-5">
              <StreakCalendar streakHistory={streak.streakHistory} />
            </div>
            <SkillRadar
              skills={[
                { name: "Rust", value: Math.min(completed.length * 15, 100), fullMark: 100 },
                { name: "Anchor", value: Math.min(completed.length * 12, 100), fullMark: 100 },
                { name: "Frontend", value: Math.min(completed.length * 10, 100), fullMark: 100 },
                { name: "Token-2022", value: Math.min(completed.length * 8, 100), fullMark: 100 },
                { name: "Security", value: Math.min(completed.length * 6, 100), fullMark: 100 },
                { name: "DeFi", value: Math.min(completed.length * 5, 100), fullMark: 100 },
              ]}
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="achievements" className="space-y-6">
            <TabsList>
              <TabsTrigger value="achievements" className="gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                {t("achievements")}
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-1.5">
                <Award className="h-3.5 w-3.5" />
                {t("credentials")}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {t("completedCourses")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements">
              {achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No achievements yet.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {pagedAchievements.map((ach) => (
                      <AchievementCard key={ach.id} achievement={ach} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAchPage((p) => Math.max(0, p - 1))}
                        disabled={achPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {achPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setAchPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={achPage === totalPages - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="credentials">
              {credentials.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t("noCredentials")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {credentials.map((cred) => (
                    <Link
                      key={cred.mintAddress}
                      href={`/certificates/${cred.mintAddress}`}
                      className="rounded-xl border bg-card p-5 hover:shadow-sm transition-all hover:border-primary/20 group"
                    >
                      <div className="aspect-[4/3] rounded-lg bg-muted mb-3 overflow-hidden relative">
                        {cred.imageUrl && !cred.imageUrl.endsWith("/og.png") && (
                          <img
                            src={cred.imageUrl}
                            alt={cred.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="font-medium text-sm">{cred.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {cred.mintAddress.slice(0, 6)}...
                        {cred.mintAddress.slice(-4)}
                      </p>
                      <ExternalLink className="h-3 w-3 mt-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completed.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No completed courses yet.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {completed.map((p) => (
                    <div
                      key={p.courseId}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.courseId}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.xpEarned} XP earned •{" "}
                          {p.completedAt
                            ? new Date(p.completedAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PlatformLayout>
    </ProtectedRoute>
  );
}
