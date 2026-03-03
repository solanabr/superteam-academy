"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BookOpen,
  Users,
  Zap,
  Award,
  ExternalLink,
  BarChart3,
  Database,
  AlertTriangle,
  Settings,
  GraduationCap,
  Code,
  Shield,
  PenSquare,
  TrendingUp,
} from "lucide-react";
import { useTracks } from "@/lib/hooks/use-tracks";
import { useDifficulties } from "@/lib/hooks/use-difficulties";
import { formatXP } from "@/lib/utils";
import type { Course, Achievement } from "@/types";
import { CourseAnalyticsTable } from "./course-analytics-table";

interface AdminDashboardProps {
  courses: Course[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail?: string;
  accent?: string;
}

function StatCard({
  icon,
  label,
  value,
  detail,
  accent = "text-st-green",
}: StatCardProps) {
  return (
    <div className="glass rounded-xl p-5 transition-all hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function getAchievementsByCategory(achievements: Achievement[]) {
  const categories = [
    "progress",
    "streaks",
    "skills",
    "community",
    "special",
  ] as const;
  return categories.map((cat) => {
    const items = achievements.filter((a) => a.category === cat);
    const totalXP = items.reduce((sum, a) => sum + a.xpReward, 0);
    return { category: cat, count: items.length, totalXP };
  });
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  progress: <GraduationCap className="h-4 w-4" />,
  streaks: <Zap className="h-4 w-4" />,
  skills: <Code className="h-4 w-4" />,
  community: <Users className="h-4 w-4" />,
  special: <Award className="h-4 w-4" />,
};

const QUICK_LINKS = [
  {
    key: "createCourse",
    href: "/admin/courses/new",
    icon: <PenSquare className="h-5 w-5" />,
    external: false,
  },
  {
    key: "analyticsPage",
    href: "/admin/analytics",
    icon: <TrendingUp className="h-5 w-5" />,
    external: false,
  },
  {
    key: "sanityCMS",
    href: "https://superteam-academy.sanity.studio",
    icon: <Database className="h-5 w-5" />,
    external: true,
  },
  {
    key: "analytics",
    href: "https://analytics.google.com",
    icon: <BarChart3 className="h-5 w-5" />,
    external: true,
  },
  {
    key: "errorMonitoring",
    href: "https://sentry.io",
    icon: <AlertTriangle className="h-5 w-5" />,
    external: true,
  },
  {
    key: "platformSettings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    external: false,
  },
];

export function AdminDashboard({ courses }: AdminDashboardProps) {
  const t = useTranslations("admin");
  const TRACKS = useTracks();
  const difficulties = useDifficulties();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetch("/api/achievements")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAchievements(Array.isArray(data) ? data : []))
      .catch(() => setAchievements([]));
  }, []);

  const totalLessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const totalChallenges = courses.reduce((sum, c) => sum + c.challengeCount, 0);
  const totalXP = courses.reduce((sum, c) => sum + c.xpTotal, 0);
  const totalEnrollments = courses.reduce(
    (sum, c) => sum + c.totalEnrollments,
    0,
  );
  const totalCompletions = courses.reduce(
    (sum, c) => sum + c.totalCompletions,
    0,
  );
  const avgCompletionRate =
    totalEnrollments > 0
      ? Math.round((totalCompletions / totalEnrollments) * 100)
      : 0;
  const activeCourses = courses.filter((c) => c.isActive).length;

  const difficultyBreakdown = new Map(
    difficulties.map((d) => [
      d.value,
      {
        label: d.label,
        color: d.color,
        count: courses.filter((c) => c.difficulty === d.value).length,
      },
    ]),
  );

  const trackBreakdown = Object.entries(TRACKS)
    .map(([id, meta]) => ({
      trackId: Number(id),
      name: meta.display,
      color: meta.color,
      count: courses.filter((c) => c.trackId === Number(id)).length,
    }))
    .filter((t) => t.count > 0);

  const achievementStats = getAchievementsByCategory(achievements);
  const totalAchievementXP = achievements.reduce(
    (sum, a) => sum + a.xpReward,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-st-green/10">
            <Shield className="h-5 w-5 text-st-green" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("totalCourses")}
          value={courses.length}
          detail={t("activeCourses", { count: activeCourses })}
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label={t("totalContent")}
          value={totalLessons}
          detail={t("contentBreakdown", { challenges: totalChallenges })}
          accent="text-brazil-teal"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label={t("totalEnrollments")}
          value={totalEnrollments.toLocaleString()}
          detail={t("completionsSummary", {
            completions: totalCompletions.toLocaleString(),
            rate: avgCompletionRate,
          })}
          accent="text-level"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label={t("xpEcosystem")}
          value={`${formatXP(totalXP)} XP`}
          detail={t("achievementXP", { xp: formatXP(totalAchievementXP) })}
          accent="text-xp"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: Course Table */}
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-xl font-bold">{t("courseAnalytics")}</h2>
            <CourseAnalyticsTable courses={courses} />
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Difficulty Breakdown */}
          <section className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("byDifficulty")}
            </h3>
            <div className="space-y-3">
              {[...difficultyBreakdown.entries()].map(
                ([value, { label, color, count }]) => (
                  <div
                    key={value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* Track Breakdown */}
          <section className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("byTrack")}
            </h3>
            <div className="space-y-3">
              {trackBreakdown.map((track) => (
                <div
                  key={track.trackId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="text-sm">{track.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{track.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Achievement System */}
          <section className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("achievementSystem")}
            </h3>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("totalBadges")}
              </span>
              <span className="text-lg font-bold text-achievement">
                {achievements.length}
              </span>
            </div>
            <div className="space-y-2">
              {achievementStats.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {CATEGORY_ICONS[cat.category]}
                    <span className="capitalize">
                      {t(`achievementCategory.${cat.category}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium">{cat.count}</span>
                    <span className="text-xp">{formatXP(cat.totalXP)} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("quickActions")}
            </h3>
            <div className="space-y-2">
              {QUICK_LINKS.map((link) => {
                const className =
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted";
                const children = (
                  <>
                    <div className="text-muted-foreground">{link.icon}</div>
                    <span className="flex-1 font-medium">
                      {t(`links.${link.key}`)}
                    </span>
                    {link.external && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </>
                );
                return link.external ? (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {children}
                  </a>
                ) : (
                  <Link key={link.key} href={link.href} className={className}>
                    {children}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Platform Health */}
          <section className="glass rounded-xl p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("platformHealth")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("health.cmsStatus")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brazil-green">
                  <span className="h-2 w-2 rounded-full bg-brazil-green" />
                  {t("health.mock")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("health.i18n")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brazil-green">
                  <span className="h-2 w-2 rounded-full bg-brazil-green" />3{" "}
                  {t("health.locales")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("health.achievements")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brazil-green">
                  <span className="h-2 w-2 rounded-full bg-brazil-green" />
                  {achievements.length}/256
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{t("health.tracks")}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-brazil-green">
                  <span className="h-2 w-2 rounded-full bg-brazil-green" />
                  {Object.keys(TRACKS).length} {t("health.active")}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
