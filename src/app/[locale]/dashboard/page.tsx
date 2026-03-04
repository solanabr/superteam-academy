"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTranslations } from "next-intl";
import {
  Zap,
  BookOpen,
  Flame,
  TrendingUp,
  Clock,
  ChevronRight,
  Trophy,
  Target,
  Star,
} from "lucide-react";
import { useXpBalance } from "@/hooks/useXpBalance";
import { useAllEnrollments } from "@/hooks/useEnrollment";
import { useCourses } from "@/hooks/useCourses";
import { useSigningMode } from "@/hooks/useSigningMode";
import { useStubXp } from "@/hooks/useStubXp";
import { countCompletedLessons, normalizeFlags } from "@/lib/bitmap";
import { getEnrollmentPda } from "@/lib/pda";
import {
  countCompletedLessonsStub,
  getAllStubEnrolledCourseIds,
  isCourseFinalizedStub,
} from "@/lib/stubStorage";
import { useAuthGate } from "@/hooks/useAuthGate";
import { PageSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { getStreakHeatmap, STREAK_UPDATED_EVENT } from "@/lib/streak";

type TValues = Record<string, string | number>;
type DashboardT = (key: string, values?: TValues) => string;

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKS = 10;
const DAYS = WEEKS * 7;

type DashboardCourseRow = {
  key: string;
  courseId: string;
  completed: number;
  total: number;
  done: boolean;
  source: "onchain" | "content";
};

function getCurrentStreakFromData(data: boolean[]): number {
  let streak = 0;
  for (const active of data) {
    if (active) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function StreakHeatmap({ t }: { t: DashboardT }) {
  const [data, setData] = useState<boolean[]>(() => getStreakHeatmap(DAYS));

  useEffect(() => {
    function syncHeatmap() {
      setData(getStreakHeatmap(DAYS));
    }

    syncHeatmap();
    window.addEventListener(STREAK_UPDATED_EVENT, syncHeatmap);
    window.addEventListener("storage", syncHeatmap);

    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, syncHeatmap);
      window.removeEventListener("storage", syncHeatmap);
    };
  }, []);

  const streak = getCurrentStreakFromData(data);
  const totalActive = data.filter(Boolean).length;

  const cols = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => data[w * 7 + d]),
  );

  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={16} style={{ color: "#f87171" }} aria-hidden="true" />
          <span
            className="font-semibold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {t("streak.title")}
          </span>
        </div>
      </div>

      <div className="flex gap-5 mb-4">
        <div>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {streak}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("streak.dayStreak")}
          </p>
        </div>
        <div>
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {totalActive}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {t("streak.totalActive")}
          </p>
        </div>
      </div>

      <div className="flex gap-px mb-1" aria-hidden="true">
        {WEEK_LABELS.map((l, i) => (
          <div
            key={i}
            className="flex-1 text-center"
            style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}
          >
            {i % 2 === 0 ? l : ""}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
          gridTemplateRows: "repeat(7, 1fr)",
          gap: "2px",
          gridAutoFlow: "column",
        }}
        role="img"
        aria-label={t("streak.ariaHeatmap")}
      >
        {cols.map((week, w) =>
          week.map((active, d) => {
            const isToday = w === 0 && d === 0;
            return (
              <div
                key={`${w}-${d}`}
                className={isToday && active ? "streak-today" : ""}
                style={{
                  height: "10px",
                  borderRadius: "2px",
                  background: active
                    ? "linear-gradient(135deg, var(--solana-purple), var(--solana-green))"
                    : "var(--bg-elevated)",
                  border: isToday
                    ? "1px solid rgba(153,69,255,0.5)"
                    : "1px solid transparent",
                }}
                aria-label={active ? t("streak.activeDay") : t("streak.inactiveDay")}
              />
            );
          }),
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          {t("streak.weeksAgo", { weeks: WEEKS })}
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          {t("streak.today")}
        </span>
      </div>
      </div>
    </SpotlightCard>
  );
}

const DAILY_GOAL_XP = 100;

function DailyGoalRing({
  earnedToday,
  t,
}: {
  earnedToday: number;
  t: DashboardT;
}) {
  const pct = Math.min((earnedToday / DAILY_GOAL_XP) * 100, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct / 100);

  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(25, 251, 155, 0.2)">
      <div
        className="rounded-2xl p-5 flex items-center gap-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
      <div className="shrink-0 relative">
        <svg
          width="90"
          height="90"
          viewBox="0 0 90 90"
          role="img"
          aria-label={t("dailyGoal.aria", { pct: Math.round(pct) })}
        >
          <defs>
            <linearGradient id="goal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--solana-purple)" />
              <stop offset="100%" stopColor="var(--solana-green)" />
            </linearGradient>
          </defs>
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            strokeWidth="7"
            className="goal-ring-track"
          />
          <circle
            cx="45"
            cy="45"
            r={r}
            fill="none"
            strokeWidth="7"
            className="goal-ring-fill"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 45 45)"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Target size={14} style={{ color: "var(--text-purple)" }} aria-hidden="true" />
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {Math.round(pct)}%
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Target
            size={13}
            style={{ color: "var(--text-purple)" }}
            aria-hidden="true"
          />
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("dailyGoal.title")}
          </p>
        </div>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {t("dailyGoal.todayProgress", {
            earned: earnedToday,
            goal: DAILY_GOAL_XP,
          })}
        </p>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-elevated)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background:
                "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
            }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          {pct >= 100
            ? t("dailyGoal.goalReached")
            : t("dailyGoal.toGo", { xp: Math.max(DAILY_GOAL_XP - earnedToday, 0) })}
        </p>
      </div>
      </div>
    </SpotlightCard>
  );
}

function AchievementsPreview({ t }: { t: DashboardT }) {
  const achievements = [
    { icon: "??", label: t("achievements.firstSteps"), earned: true },
    { icon: "??", label: t("achievements.enrolled"), earned: true },
    { icon: "?", label: t("achievements.speedRun"), earned: false },
    { icon: "??", label: t("achievements.completer"), earned: false },
  ];

  return (
    <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.2)">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={15} style={{ color: "#fbbf24" }} aria-hidden="true" />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("achievements.title")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {achievements.map((a) => (
          <div
            key={a.label}
            title={a.label}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: a.earned
                  ? "rgba(153,69,255,0.12)"
                  : "var(--bg-elevated)",
                border: `1px solid ${a.earned ? "rgba(153,69,255,0.3)" : "var(--border-subtle)"}`,
                filter: a.earned ? "none" : "grayscale(1) opacity(0.4)",
              }}
              aria-label={`${a.label}: ${a.earned ? t("achievements.earned") : t("achievements.locked")}`}
            >
              {a.icon}
            </div>
            <span
              style={{
                fontSize: "0.6rem",
                color: a.earned ? "var(--text-secondary)" : "var(--text-muted)",
                textAlign: "center",
                letterSpacing: "-0.01em",
              }}
            >
              {a.label}
            </span>
          </div>
        ))}
      </div>
      </div>
    </SpotlightCard>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const t = useTranslations("Dashboard");
  const { isLoggedIn, isChecking, redirectToAuth } = useAuthGate();
  const { connected, publicKey } = useWallet();
  const { data: xp, isLoading: xpLoading } = useXpBalance();
  const { data: enrollments, isLoading: enrollLoading } = useAllEnrollments();
  const { data: courses } = useCourses();
  const signingMode = useSigningMode();
  const localXp = useStubXp();

  useEffect(() => {
    if (isChecking) return;
    if (!isLoggedIn) {
      redirectToAuth();
    }
  }, [isChecking, isLoggedIn, redirectToAuth]);

  if (isChecking) return <PageSkeleton />;
  if (!isLoggedIn) return null;

  if (!connected) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <EmptyState
          icon={TrendingUp}
          title={t("empty.title")}
          description={t("empty.description")}
          action={
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("empty.action")}
            </p>
          }
        />
      </div>
    );
  }

  if (xpLoading || enrollLoading) return <PageSkeleton />;

  const isStub = signingMode === "stub";
  const displayXp = isStub ? localXp : (xp?.amount ?? 0);
  const displayLevel = Math.floor(Math.sqrt(displayXp / 100));
  const nextLevelXp = Math.pow(displayLevel + 1, 2) * 100;
  const currentLevelXp = Math.pow(displayLevel, 2) * 100;
  const progress =
    displayLevel === 0
      ? (displayXp / 100) * 100
      : ((displayXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const dailyXp = Math.min(displayXp, 100);
  const wallet = publicKey?.toBase58() ?? "";
  const coursesByPublicKey = new Map(
    (courses ?? []).map((course) => [course.publicKey.toBase58(), course]),
  );

  const myEnrollments = (enrollments ?? []).filter((e) => {
    if (!publicKey || !courses) return false;
    return courses.some((c) => {
      try {
        const [pda] = getEnrollmentPda(c.courseId, publicKey);
        return pda.toBase58() === e.publicKey.toBase58();
      } catch {
        return false;
      }
    });
  });

  const onchainRows: DashboardCourseRow[] = [];
  for (const enrollment of myEnrollments) {
    const course = coursesByPublicKey.get(enrollment.course.toBase58());
    if (!course) continue;
    onchainRows.push({
      key: enrollment.publicKey.toBase58(),
      courseId: course.courseId,
      completed: countCompletedLessons(normalizeFlags(enrollment.lessonFlags)),
      total: course.lessonCount,
      done: !!enrollment.completedAt,
      source: "onchain",
    });
  }

  const onchainCourseIds = new Set(onchainRows.map((row) => row.courseId));
  const stubRows: DashboardCourseRow[] = [];
  if (isStub && wallet) {
    for (const courseId of getAllStubEnrolledCourseIds(wallet)) {
      if (onchainCourseIds.has(courseId)) continue;
      const course = (courses ?? []).find((c) => c.courseId === courseId);
      if (!course) continue;
      stubRows.push({
        key: `stub:${courseId}`,
        courseId,
        completed: countCompletedLessonsStub(wallet, courseId, course.lessonCount),
        total: course.lessonCount,
        done: isCourseFinalizedStub(wallet, courseId),
        source: "content",
      });
    }
  }

  const myCourseRows = [...onchainRows, ...stubRows];
  const inProgressRow =
    myCourseRows.find((row) => !row.done && row.completed < row.total) ?? null;
  const inProgressCourse = inProgressRow
    ? (courses ?? []).find((c) => c.courseId === inProgressRow.courseId)
    : null;

  const enrolledCourseIds = new Set(myCourseRows.map((row) => row.courseId));
  const recommended = (courses ?? [])
    .filter((c) => !enrolledCourseIds.has(c.courseId) && c.isActive)
    .slice(0, 2);

  const demoActivity = [
    {
      icon: Zap,
      label: t("activity.items.lessonComplete"),
      time: t("activity.items.time2h"),
      color: "var(--solana-purple)",
    },
    {
      icon: BookOpen,
      label: t("activity.items.courseEnroll"),
      time: t("activity.items.time3h"),
      color: "var(--solana-green)",
    },
    {
      icon: Trophy,
      label: t("activity.items.levelUp"),
      time: t("activity.items.time1d"),
      color: "#fbbf24",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(153,69,255,0.1)" }}
          >
            <TrendingUp size={18} style={{ color: "var(--solana-purple)" }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {t("title")}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-6)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <SpotlightCard className="rounded-2xl" spotlightColor="rgba(153, 69, 255, 0.24)">
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(153,69,255,0.18) 0%, rgba(25,251,155,0.06) 100%)",
              border: "1px solid rgba(153,69,255,0.3)",
            }}
          >
          <div
            className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle, rgba(153,69,255,0.22) 0%, transparent 70%)",
            }}
          />

          <div className="flex items-start justify-between mb-4 relative">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Zap
                  size={14}
                  style={{ color: "var(--text-purple)" }}
                  aria-hidden="true"
                />
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-purple)" }}
                >
                  {t("xp.total")}
                </p>
              </div>
              <p
                className="text-4xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {displayXp.toLocaleString("en-US")}
              </p>
            </div>
            <div
              className="px-3 py-2 rounded-xl text-right"
              style={{
                background: "rgba(153,69,255,0.15)",
                border: "1px solid rgba(153,69,255,0.25)",
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: "var(--text-purple)" }}
              >
                {t("xp.level")}
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {displayLevel}
              </p>
            </div>
          </div>

          <div>
            <div
              className="flex justify-between text-xs mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <span>{t("xp.levelShort", { level: displayLevel })}</span>
              <span>
                {t("xp.nextLevel", {
                  next: displayLevel + 1,
                  xp: nextLevelXp.toLocaleString("en-US"),
                })}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(0,0,0,0.3)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  background:
                    "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                }}
              />
            </div>
          </div>
          </div>
        </SpotlightCard>

        <DailyGoalRing earnedToday={dailyXp} t={t} />
      </div>

      <div className="mb-6">
        <StreakHeatmap t={t} />
      </div>

      <div className="mb-6">
        <h2
          className="text-base font-semibold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          {t("sections.continueLearning")}
        </h2>
        {inProgressCourse && inProgressRow ? (
          <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.2)">
            <Link
              href={`/${locale}/courses/${inProgressCourse.courseId}/lessons/${Math.min(inProgressRow.completed, Math.max(inProgressCourse.lessonCount - 1, 0))}`}
              className="flex items-center justify-between rounded-xl p-4 transition-all duration-150"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border-purple)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--border-default)";
                el.style.transform = "translateY(0)";
              }}
            >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(153,69,255,0.12)",
                  border: "1px solid rgba(153,69,255,0.2)",
                }}
              >
                <BookOpen
                  size={18}
                  style={{ color: "var(--text-purple)" }}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {inProgressCourse.courseId}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("continue.lessonOf", {
                    current: inProgressRow.completed + 1,
                    total: inProgressCourse.lessonCount,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div
                  className="h-1.5 w-24 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-elevated)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(inProgressRow.completed / inProgressCourse.lessonCount) * 100}%`,
                      background:
                        "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                    }}
                  />
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {inProgressRow.completed}/{inProgressCourse.lessonCount}
                </p>
              </div>
              <ChevronRight
                size={18}
                style={{ color: "var(--text-muted)" }}
                aria-hidden="true"
              />
            </div>
            </Link>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.2)">
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("continue.none")} {" "}
              <Link
                href={`/${locale}/courses`}
                className="underline"
                style={{ color: "var(--text-purple)" }}
              >
                {t("continue.browseCta")}
              </Link>
            </p>
            </div>
          </SpotlightCard>
        )}
      </div>

      {recommended.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("sections.recommended")}
            </h2>
            <Link
              href={`/${locale}/courses`}
              className="text-xs"
              style={{ color: "var(--text-purple)" }}
            >
              {t("recommended.seeAll")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommended.map((course) => (
              <Link
                key={course.publicKey.toBase58()}
                href={`/${locale}/courses/${course.courseId}`}
                className="rounded-xl p-4 flex items-center gap-3 transition-all duration-150"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--border-purple)";
                  el.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--border-subtle)";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(153,69,255,0.1)" }}
                >
                  <BookOpen
                    size={15}
                    style={{ color: "var(--text-purple)" }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {course.courseId}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("recommended.lessonXp", {
                      lessons: course.lessonCount,
                      xp: course.xpPerLesson,
                    })}
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  style={{ color: "var(--text-muted)" }}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {myCourseRows.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("sections.myCourses")}
            </h2>
            <Link
              href={`/${locale}/courses`}
              className="text-xs transition-colors duration-150"
              style={{ color: "var(--text-purple)" }}
            >
              {t("myCourses.browseAll")}
            </Link>
          </div>
          <div className="space-y-2">
            {myCourseRows.map((row) => {
              const course = (courses ?? []).find((c) => c.courseId === row.courseId);
              const completed = row.completed;
              const total = row.total;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const done = row.done;

              return (
                <Link
                  key={row.key}
                  href={`/${locale}/courses/${course?.courseId ?? row.courseId}`}
                  className="flex items-center gap-3 rounded-xl p-3.5 transition-all duration-150"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e2) => {
                    const el = e2.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-purple)";
                    el.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e2) => {
                    const el = e2.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border-subtle)";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: done
                        ? "rgba(25,251,155,0.12)"
                        : "var(--bg-elevated)",
                    }}
                  >
                    {done ? (
                      <Trophy
                        size={14}
                        style={{ color: "var(--solana-green)" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <BookOpen
                        size={14}
                        style={{ color: "var(--text-muted)" }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {course?.courseId ?? row.courseId}
                    </p>
                    {!done && total > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="flex-1 h-1 rounded-full overflow-hidden"
                          style={{ background: "var(--bg-elevated)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(90deg, var(--solana-purple), var(--solana-green))",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {completed}/{total}
                        </span>
                      </div>
                    )}
                    <div className="mt-1">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          color:
                            row.source === "onchain"
                              ? "var(--solana-green)"
                              : "#fbbf24",
                          background:
                            row.source === "onchain"
                              ? "rgba(25,251,155,0.1)"
                              : "rgba(251,191,36,0.1)",
                          border:
                            row.source === "onchain"
                              ? "1px solid rgba(25,251,155,0.25)"
                              : "1px solid rgba(251,191,36,0.25)",
                        }}
                      >
                        {row.source === "onchain"
                          ? t("myCourses.sourceOnchain")
                          : t("myCourses.sourceDemo")}
                      </span>
                    </div>
                  </div>
                  {done && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        color: "var(--solana-green)",
                        background: "rgba(25,251,155,0.1)",
                        border: "1px solid rgba(25,251,155,0.25)",
                      }}
                    >
                      {t("myCourses.done")}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <AchievementsPreview t={t} />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("sections.recentActivity")}
            </h2>
          </div>
          <SpotlightCard className="rounded-xl" spotlightColor="rgba(153, 69, 255, 0.2)">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
            {demoActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border-subtle)" : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${item.color}18` }}
                >
                  <item.icon
                    size={14}
                    aria-hidden="true"
                    style={{ color: item.color }}
                  />
                </div>
                <p
                  className="text-sm flex-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.label}
                </p>
                <span
                  className="text-xs shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Clock size={10} className="inline mr-1" aria-hidden="true" />
                  {item.time}
                </span>
              </div>
            ))}
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
