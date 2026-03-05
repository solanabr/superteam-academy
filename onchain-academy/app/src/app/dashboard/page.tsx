"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Trophy,
  Zap,
  Flame,
  Shield,
  Play,
  ChevronRight,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale } from "@/providers/locale-provider";
import { useUserStore } from "@/store/user-store";
import { learningProgressService } from "@/services/learning-progress-service";
import { contentService } from "@/services/content-service";
import type { CourseSummary } from "@/types/domain";

export default function DashboardPage(): React.JSX.Element {
  const { t } = useLocale();
  const { data: session } = useSession();
  const { publicKey } = useWallet();
  const {
    xp,
    level,
    streakDays,
    longestStreakDays,
    streakCalendar,
    walletAddress,
  } = useUserStore();
  const [achievementNotice, setAchievementNotice] = useState("");
  const [activeCourse, setActiveCourse] = useState<CourseSummary | null>(null);
  const [activeCourseProgress, setActiveCourseProgress] = useState(0);

  const nextLevelTarget = useMemo(() => level ** 2 * 100, [level]);
  const currentLevelStart = useMemo(() => (level - 1) ** 2 * 100, [level]);

  const withinLevel = xp - currentLevelStart;
  const span = Math.max(1, nextLevelTarget - currentLevelStart);
  const progress = Math.min(
    100,
    Math.max(0, Math.round((withinLevel / span) * 100)),
  );

  useEffect(() => {
    void contentService
      .getCourses()
      .then((courses) => {
        const first = courses[0] ?? null;
        setActiveCourse(first);
        if (!first || !walletAddress) {
          setActiveCourseProgress(0);
          return;
        }
        return learningProgressService
          .getProgress(walletAddress, first.id)
          .then((row) => {
            setActiveCourseProgress(row.completionPercent);
          });
      })
      .catch(() => {
        setActiveCourse(null);
        setActiveCourseProgress(0);
      });
  }, [walletAddress]);

  async function handleClaimAchievement(
    achievementTypeId: string,
  ): Promise<void> {
    if (!walletAddress) {
      setAchievementNotice(t("dashboardPage.connectWalletClaim"));
      return;
    }

    try {
      const result = await learningProgressService.claimAchievement(
        {
          achievementTypeId,
        },
        session?.backendToken,
      );
      setAchievementNotice(
        `${t("dashboardPage.claimQueued")} (${result.requestId.slice(0, 8)}...).`,
      );
    } catch (error) {
      setAchievementNotice(
        error instanceof Error ? error.message : t("dashboardPage.claimFailed"),
      );
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header Profile Section */}
      <section className="relative rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl overflow-hidden shadow-2xl p-8 sm:p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="space-y-4">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 py-1 px-3 border-primary/30 backdrop-blur border text-sm font-semibold tracking-wide">
              {t("dashboardPage.rookieDeveloper")}
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
              {publicKey ? (
                <>
                  {t("dashboardPage.welcomeBack")}{" "}
                  <span className="text-muted-foreground">
                    {publicKey.toBase58().slice(0, 4)}...
                    {publicKey.toBase58().slice(-4)}
                  </span>
                </>
              ) : (
                t("dashboardPage.learningDashboard")
              )}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("dashboardPage.headerSubtitle")}
            </p>
          </div>

          {!publicKey && (
            <div className="shrink-0 p-4 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl max-w-sm text-sm font-medium">
              {t("dashboardPage.connectWalletBanner")}
            </div>
          )}
        </div>
      </section>

      {/* Primary Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Card */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden group hover:border-secondary/40 transition-all duration-300 scanline">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "var(--brand-secondary)" }}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-mono font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {t("dashboardPage.totalXp")}
            </CardTitle>
            <Zap
              className="h-4 w-4 fill-current"
              style={{ color: "#f59e0b" }}
            />
          </CardHeader>
          <CardContent className="pt-1">
            <div
              className="font-display text-5xl font-bold tracking-tight"
              style={{
                color: "#f59e0b",
                textShadow: "0 0 20px rgba(245,158,11,0.3)",
              }}
            >
              {xp.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono">
              {t("dashboardPage.globalTop")}
            </p>
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden group hover:border-primary/40 transition-all duration-300 scanline">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "var(--brand-primary)" }}
          />
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-mono font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {t("dashboardPage.developerLevel")}
            </CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="flex items-end gap-2">
              <div className="font-display text-5xl font-bold tracking-tight text-foreground">
                {level}
              </div>
              <span className="font-mono text-sm text-muted-foreground mb-1.5">
                / {level + 1}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono group-hover:text-primary/70 transition-colors">
              {t("dashboardPage.unlockLevel")} {level + 1}{" "}
              {t("dashboardPage.unlockLevelSuffix")}
            </p>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="bg-background/40 backdrop-blur-md border-border/50 shadow-lg relative overflow-hidden group hover:border-orange-500/40 transition-all duration-300 scanline">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0">
            <CardTitle className="text-[11px] font-mono font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {t("dashboardPage.dailyStreak")}
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="pt-1">
            <div className="font-display text-5xl font-bold tracking-tight text-foreground">
              {streakDays}
              <span className="text-2xl text-muted-foreground font-sans font-normal ml-2">
                {t("dashboardPage.days")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-mono">
              {t("dashboardPage.streakMultiplier")}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="p-6 bg-background/50 border-border/40 scanline relative">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold">
              {t("dashboardPage.streakCalendar")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              {t("dashboardPage.currentBest")}{" "}
              <span className="text-orange-400 font-bold">{streakDays}</span>{" "}
              {t("dashboardPage.days")} &middot; {t("dashboardPage.best")}{" "}
              <span className="text-foreground font-bold">
                {longestStreakDays}
              </span>{" "}
              {t("dashboardPage.days")}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted/40" />
              inactive
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
              active
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: "#f59e0b" }}
              />
              bonus
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-[7px]">
          {streakCalendar.slice(-35).map((day, i) => (
            <div
              key={day.date}
              className="streak-dot"
              title={day.date}
              style={{
                background: day.active
                  ? day.bonusApplied
                    ? "#f59e0b"
                    : "#f97316"
                  : "rgba(148,163,184,0.14)",
                boxShadow: day.active
                  ? day.bonusApplied
                    ? "0 0 8px rgba(245,158,11,0.5)"
                    : "0 0 6px rgba(249,115,22,0.35)"
                  : "none",
                animationDelay: `${i * 18}ms`,
              }}
            />
          ))}
        </div>
      </Card>

      {/* Progress Bar Container */}
      <Card className="p-8 bg-background/60 backdrop-blur-xl border-border/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />{" "}
              {t("dashboardPage.developerLevel")} {level}{" "}
              {t("dashboardPage.levelProgression")}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {t("dashboardPage.rankUpHint")}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">
              {xp.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {" "}
              / {nextLevelTarget.toLocaleString()} XP
            </span>
          </div>
        </div>

        <ProgressBar
          value={progress}
          className="h-4 bg-muted/40"
          indicatorClassName="shadow-[0_0_20px_rgba(52,211,153,0.4)]"
        />

        <div className="flex justify-between items-center mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
      </Card>

      {/* Tabs Layout */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-muted/30 border border-border/50 p-1 w-full justify-start h-12 overflow-x-auto">
          <TabsTrigger
            value="courses"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 h-full text-sm font-medium"
          >
            {t("dashboardPage.activeCourses")}
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-6 h-full text-sm font-medium"
          >
            {t("dashboardPage.achievementsTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6 outline-none">
          <div className="grid md:grid-cols-2 gap-6">
            {activeCourse ? (
              <Card className="bg-background/40 border-border/50 hover:border-border transition-colors flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">
                      {t("dashboardPage.inProgress")}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {Math.round(activeCourseProgress)}%{" "}
                      {t("courseDetailPage.completeSuffix")}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-display">
                    {activeCourse.title}
                  </CardTitle>
                  <CardDescription>{activeCourse.track}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ProgressBar value={activeCourseProgress} className="h-2" />
                </CardContent>
                <div className="p-4 border-t border-border/40 bg-muted/10 mt-auto">
                  <Button
                    className="w-full font-bold shadow-md hover:scale-[1.02] transition-transform"
                    asChild
                  >
                    <Link href={`/courses/${activeCourse.slug}`}>
                      {t("dashboardPage.resumeLearning")}{" "}
                      <Play className="h-4 w-4 ml-2 fill-current" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : null}

            <Card className="bg-background/40 border-border/50 hover:border-border transition-colors border-dashed bg-muted/5 flex flex-col justify-center items-center text-center p-8 min-h-[250px]">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2">
                {t("dashboardPage.startNewTrack")}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
                {t("dashboardPage.startNewTrackDesc")}
              </p>
              <Button variant="outline" asChild>
                <Link href="/courses">
                  {t("dashboardPage.browseCatalog")}{" "}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="outline-none">
          {achievementNotice ? (
            <p className="text-sm text-muted-foreground mb-4">
              {achievementNotice}
            </p>
          ) : null}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Mock Achievements */}
            {[
              {
                title: t("dashboardPage.achievementFirstBlood"),
                desc: t("dashboardPage.achievementFirstBloodDesc"),
                icon: Flame,
                unlocked: true,
              },
              {
                title: t("dashboardPage.achievementRustacean"),
                desc: t("dashboardPage.achievementRustaceanDesc"),
                icon: Shield,
                unlocked: xp > 1000,
              },
              {
                title: t("dashboardPage.achievementAnchorMaster"),
                desc: t("dashboardPage.achievementAnchorMasterDesc"),
                icon: Award,
                unlocked: xp > 5000,
              },
              {
                title: t("dashboardPage.achievementDefiDegen"),
                desc: t("dashboardPage.achievementDefiDegenDesc"),
                icon: Zap,
                unlocked: false,
              },
            ].map((achievement, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                  achievement.unlocked
                    ? "bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
                    : "bg-muted/20 border-border/40 opacity-50 grayscale"
                }`}
              >
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                    achievement.unlocked
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <achievement.icon className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-sm mb-1">{achievement.title}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {achievement.unlocked
                    ? t("dashboardPage.unlocked")
                    : t("dashboardPage.locked")}
                </p>
                {achievement.unlocked ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full text-xs h-8"
                    onClick={() =>
                      void handleClaimAchievement(`achievement-${i + 1}`)
                    }
                  >
                    {t("dashboardPage.claim")}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
