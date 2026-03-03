"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useStreak } from "@/hooks/useStreak";
import { useCredentials } from "@/hooks/useCredentials";
import { useActivity } from "@/hooks/useActivity";
import { useSyncXp } from "@/hooks/useSyncXp";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakWidget } from "@/components/gamification/StreakWidget";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { MOCK_COURSES } from "@/lib/mock-courses";
import { Link } from "@/i18n/navigation";
import {
  BookOpen,
  Award,
  Zap,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
  Trophy,
  Shield,
} from "lucide-react";
import type { Achievement } from "@/types";
import { getAchievements } from "@/services/credentials";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityItemType =
  | "lesson"
  | "xp"
  | "milestone"
  | "enrollment"
  | "credential";

interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationHours: number;
  xpReward: number;
  trackName: string;
  trackIcon: string;
  trackColor: string;
  slug: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
}

const TRACK_META: Record<
  number,
  { name: string; icon: string; color: string }
> = {
  1: { name: "Solana Basics", icon: "◎", color: "var(--accent)" },
  2: { name: "Anchor Framework", icon: "⚓", color: "#9945FF" },
  3: { name: "DeFi", icon: "💹", color: "#00D4FF" },
  4: { name: "Token-2022", icon: "🪙", color: "#F5A623" },
  5: { name: "Security", icon: "🔒", color: "#FF4444" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "var(--accent)",
  intermediate: "#F5A623",
  advanced: "#FF4444",
};

function buildCoursesWithProgress(): CourseWithProgress[] {
  return MOCK_COURSES.map((course) => {
    const totalLessons =
      course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ??
      0;
    let completedLessons = 0;
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem(`completed_${course.slug}`) ?? "[]",
      );
      completedLessons = ids.length;
    } catch {}
    const track = TRACK_META[course.trackId ?? 0] ?? {
      name: "General",
      icon: "📚",
      color: "#666666",
    };
    return {
      id: course._id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty as "beginner" | "intermediate" | "advanced",
      durationHours: course.durationHours ?? 0,
      xpReward: course.xpReward ?? 0,
      slug: course.slug,
      trackName: track.name,
      trackIcon: track.icon,
      trackColor: track.color,
      completedLessons,
      totalLessons,
      progressPercent:
        totalLessons > 0
          ? completedLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : localStorage.getItem(`last_lesson_${course.slug}`)
              ? 1
              : 0
          : 0,
    };
  });
}

// ─── Daily challenge widget ───────────────────────────────────────────────────

interface DailyChallenge {
  title: string;
  courseTitle: string;
  courseDescription: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  xpReward: number;
  estimatedMinutes: number;
  courseSlug: string;
  lessonId: string;
}

function buildDailyChallenges(): DailyChallenge[] {
  const result: DailyChallenge[] = [];
  for (const course of MOCK_COURSES) {
    for (const mod of course.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        if (lesson.type === "challenge") {
          result.push({
            title: lesson.title.replace(/^Challenge:\s*/i, ""),
            courseTitle: course.title,
            courseDescription: course.description,
            difficulty: course.difficulty as
              | "beginner"
              | "intermediate"
              | "advanced",
            xpReward: lesson.xpReward ?? 0,
            estimatedMinutes: lesson.estimatedMinutes ?? 30,
            courseSlug: course.slug,
            lessonId: lesson._id,
          });
        }
      }
    }
  }
  return result;
}

const ALL_CHALLENGES = buildDailyChallenges();

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function DailyChallengeWidget() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  const challenge = ALL_CHALLENGES[dayIndex % ALL_CHALLENGES.length];
  const [resetsIn, setResetsIn] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setResetsIn(getTimeUntilMidnight()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!challenge) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-mono text-lg font-semibold text-foreground">
          Daily Challenge
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent animate-pulse">
          LIVE
        </span>
        <span className="ml-auto text-xs font-mono text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Resets in {resetsIn}
        </span>
      </div>
      <div className="bg-card border border-accent/20 rounded p-5 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(20,241,149,0.06), transparent 70%)",
          }}
        />
        <div className="flex items-start justify-between gap-4 relative">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20">
                {challenge.difficulty}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                ~{challenge.estimatedMinutes} min
              </span>
            </div>
            <h3 className="font-mono text-sm font-semibold text-foreground mb-1">
              {challenge.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {challenge.courseDescription}
            </p>
            <p className="text-[10px] font-mono text-subtle mt-1">
              {challenge.courseTitle}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-2xl font-bold text-accent">
              +{challenge.xpReward}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              XP
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={{
              pathname: "/courses/[slug]/lessons/[id]",
              params: { slug: challenge.courseSlug, id: challenge.lessonId },
            }}
            className="inline-flex items-center gap-2 bg-accent text-black font-mono font-semibold text-sm px-5 py-2 rounded-full hover:bg-accent-dim transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Solve Challenge
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Activity icon ────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityItemType }) {
  switch (type) {
    case "lesson":
      return <CheckCircle2 className="h-3.5 w-3.5 text-accent" />;
    case "xp":
      return <Zap className="h-3.5 w-3.5 text-[#F5A623]" />;
    case "milestone":
      return <Flame className="h-3.5 w-3.5 text-[#F5A623]" />;
    case "enrollment":
      return <BookOpen className="h-3.5 w-3.5 text-[#9945FF]" />;
    case "credential":
      return <Award className="h-3.5 w-3.5 text-[#00D4FF]" />;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { data: xpData, loading: xpLoading } = useXpBalance();
  const { streak } = useStreak();
  const { credentials, loading: credsLoading } = useCredentials();
  const {
    items: activityItems,
    thisWeek,
    loading: activityLoading,
  } = useActivity();
  useSyncXp();

  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<
    CourseWithProgress[]
  >([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!publicKey) return;
    (async () => {
      try {
        const data = await getAchievements(publicKey.toBase58());
        setAchievements(data);
      } catch {
        setAchievements([]);
      }
    })();
  }, [publicKey]);

  useEffect(() => {
    const all = buildCoursesWithProgress();
    // Sort: in-progress first, then not-started (by difficulty asc), then completed
    const inProgress = all.filter(
      (c) => c.progressPercent > 0 && c.progressPercent < 100,
    );
    const notStarted = all.filter((c) => c.progressPercent === 0);
    const completed = all.filter((c) => c.progressPercent === 100);
    const diffOrder: Record<string, number> = {
      beginner: 0,
      intermediate: 1,
      advanced: 2,
    };
    notStarted.sort(
      (a, b) => (diffOrder[a.difficulty] ?? 0) - (diffOrder[b.difficulty] ?? 0),
    );
    setInProgressCourses(inProgress);
    setCourses([...inProgress, ...notStarted, ...completed].slice(0, 3));
  }, []);

  if (!connected) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">◎</span>
        <h2 className="font-mono text-xl font-bold text-foreground">
          Connect your wallet
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Connect your Solana wallet to view your dashboard, XP balance, and
          learning progress.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="mt-2 bg-accent text-black font-mono font-semibold px-6 py-2.5 rounded-full hover:bg-accent-dim transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-foreground">
          {t("title")}
        </h1>
        {publicKey && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {publicKey.toBase58().slice(0, 20)}...
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* XP Card */}
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              XP Balance
            </span>
          </div>
          {xpLoading ? (
            <div className="h-8 bg-elevated rounded animate-pulse mb-3" />
          ) : xpData ? (
            <>
              <div className="font-mono text-3xl font-bold text-foreground mb-1">
                {xpData.balance.toLocaleString()}
                <span className="text-sm text-muted-foreground ml-1">XP</span>
              </div>
              <XPBar xpData={xpData} showLabel={true} />
            </>
          ) : (
            <div className="font-mono text-3xl font-bold text-foreground">
              0 XP
            </div>
          )}
        </div>

        {/* Credentials Card */}
        <Link href="/certificates" className="block">
          <div className="bg-card border border-border rounded p-5 hover:border-[#9945FF]/40 transition-colors h-full">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-[#9945FF]" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                Credentials
              </span>
            </div>
            {credsLoading ? (
              <div className="h-8 bg-elevated rounded animate-pulse" />
            ) : (
              <div className="font-mono text-3xl font-bold text-foreground">
                {credentials.length}
                <span className="text-sm text-muted-foreground ml-1">NFTs</span>
              </div>
            )}
            <p className="text-[10px] text-[#9945FF]/70 font-mono mt-2">
              View certificates →
            </p>
          </div>
        </Link>

        {/* Activity summary */}
        <div className="bg-card border border-border rounded p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-[#00D4FF]" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              This Week
            </span>
          </div>
          {activityLoading ? (
            <div className="h-8 bg-elevated rounded animate-pulse mb-2" />
          ) : (
            <div className="font-mono text-3xl font-bold text-foreground">
              {thisWeek}
              <span className="text-sm text-muted-foreground ml-1">
                lessons
              </span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground font-mono mt-2">
            Keep the momentum going
          </p>
        </div>
      </div>

      {/* Streak calendar */}
      <div className="bg-card border border-border rounded p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Streak
          </span>
        </div>
        <StreakWidget streak={streak} />
      </div>

      {/* Recent Achievements */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#F5A623]" />
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-wider">
              Achievements
            </h2>
          </div>
          {achievements.length > 0 && (
            <Link
              href="/profile"
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              View all
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {achievements.length === 0 ? (
          <div className="bg-card border border-border rounded p-6 text-center">
            <Shield className="h-8 w-8 text-subtle mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-mono">
              No achievements yet. Complete courses to earn badges.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {achievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className="bg-card border border-border rounded p-4 flex gap-3 items-start"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded flex items-center justify-center bg-[#F5A623]/10 border border-[#F5A623]/20">
                  <Shield className="h-4 w-4 text-[#F5A623]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold text-foreground leading-snug line-clamp-1">
                    {achievement.name}
                  </p>
                  <p className="text-[10px] font-mono text-accent mt-0.5">
                    +{achievement.xpReward} XP
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {new Date(achievement.awardedAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-column layout: activity feed + courses */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Activity feed — 2 cols */}
        <div className="lg:col-span-2 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-wider">
              Recent Activity
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground">
              Last 7 days
            </span>
          </div>

          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-elevated rounded animate-pulse"
                />
              ))}
            </div>
          ) : activityItems.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground text-center py-8">
              Complete your first lesson to see activity here.
            </p>
          ) : (
            <ol className="relative">
              {activityItems.map((item, idx) => (
                <li key={item.id} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border flex-shrink-0 mt-0.5 group-hover:border-border-hover transition-colors">
                      <ActivityIcon type={item.type} />
                    </div>
                    {idx < activityItems.length - 1 && (
                      <div className="w-px flex-1 bg-elevated my-1 min-h-[16px]" />
                    )}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <p className="text-xs font-mono text-foreground leading-snug">
                      {item.message}
                    </p>
                    {item.detail && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.detail}
                      </p>
                    )}
                    <p className="text-[10px] text-subtle font-mono mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {item.timestamp}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Up Next courses — 3 cols */}
        <div className="lg:col-span-3 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-sm font-semibold text-foreground uppercase tracking-wider">
              Up Next
            </h2>
            <Link
              href="/courses"
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
            >
              Browse all
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const diffColor =
                DIFFICULTY_COLORS[course.difficulty] ?? "#666666";
              return (
                <Link
                  key={course.id}
                  href={{
                    pathname: "/courses/[slug]",
                    params: { slug: course.slug },
                  }}
                >
                  <article className="group flex gap-3 p-3 rounded border border-border hover:border-border-hover hover:bg-background transition-all">
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: `${course.trackColor}15`,
                        border: `1px solid ${course.trackColor}30`,
                      }}
                    >
                      {course.trackIcon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-xs font-semibold text-foreground group-hover:text-white transition-colors leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-1">
                        {course.description}
                      </p>

                      {course.progressPercent > 0 &&
                      course.progressPercent < 100 ? (
                        <div className="mt-1.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-mono text-accent">
                              {course.completedLessons}/{course.totalLessons}{" "}
                              lessons
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {course.progressPercent}%
                            </span>
                          </div>
                          <div className="h-1 bg-elevated rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-1.5">
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm"
                            style={{
                              color: diffColor,
                              backgroundColor: `${diffColor}18`,
                              border: `1px solid ${diffColor}35`,
                            }}
                          >
                            {course.difficulty}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {course.durationHours}h
                          </span>
                          {course.progressPercent === 100 ? (
                            <span className="text-[9px] font-mono text-accent flex items-center gap-0.5 ml-auto">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Completed
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-accent flex items-center gap-0.5 ml-auto">
                              <Zap className="h-2.5 w-2.5" />
                              {course.xpReward.toLocaleString()} XP
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-subtle flex-shrink-0 self-center group-hover:text-muted-foreground transition-colors" />
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <DailyChallengeWidget />

      {/* Continue Learning */}
      {inProgressCourses.length > 0 ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-lg font-semibold text-foreground">
              {t("continueLearning")}
            </h2>
            <Link
              href="/courses"
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              Browse all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgressCourses.map((course) => (
              <Link
                key={course.id}
                href={{
                  pathname: "/courses/[slug]",
                  params: { slug: course.slug },
                }}
              >
                <div className="group bg-card border border-border rounded p-4 hover:border-border-hover transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{course.trackIcon}</span>
                    <span className="text-xs font-mono font-semibold text-foreground line-clamp-1 group-hover:text-white transition-colors">
                      {course.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                    <span className="text-[10px] font-mono text-accent">
                      {course.progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-lg font-semibold text-foreground">
              {t("continueLearning")}
            </h2>
            <Link
              href="/courses"
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              Browse all →
            </Link>
          </div>
          <div className="bg-card border border-border rounded p-6 text-center">
            <BookOpen className="h-8 w-8 text-subtle mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-mono mb-4">
              {t("noActivity")}
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-accent text-black font-mono font-semibold text-sm px-5 py-2 rounded-full hover:bg-accent-dim transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      )}

      {/* Credentials grid */}
      {credentials.length > 0 && (
        <div>
          <h2 className="font-mono text-lg font-semibold text-foreground mb-4">
            {t("credentials")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {credentials.map((cred) => (
              <CredentialCard key={cred.id} credential={cred} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
