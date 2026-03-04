"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import {
  BookOpen,
  Users,
  Zap,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Activity,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAllCourses } from "@/lib/solana/queries";
import { formatXp } from "@/lib/utils";
import type { CourseAccount } from "@/types/program";
import type { PublicKey } from "@solana/web3.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnChainCourse {
  publicKey: PublicKey;
  account: CourseAccount;
}

interface AdminStats {
  totalCourses: number;
  totalEnrollments: number;
  totalXpMinted: number;
  activeLearners: number;
}

// ── Seed activity feed (realistic mock) ──────────────────────────────────────

const SEED_ACTIVITIES = [
  {
    id: "a1",
    type: "enrollment" as const,
    wallet: "8xPq...3Yzk",
    courseId: "solana-fundamentals",
    timestamp: Date.now() - 4 * 60 * 1000,
  },
  {
    id: "a2",
    type: "lesson_complete" as const,
    wallet: "4mNr...7Bvw",
    courseId: "anchor-development",
    timestamp: Date.now() - 18 * 60 * 1000,
  },
  {
    id: "a3",
    type: "enrollment" as const,
    wallet: "2kTj...9Alp",
    courseId: "token-2022-nfts",
    timestamp: Date.now() - 35 * 60 * 1000,
  },
  {
    id: "a4",
    type: "lesson_complete" as const,
    wallet: "6cFy...1Mnq",
    courseId: "solana-fundamentals",
    timestamp: Date.now() - 62 * 60 * 1000,
  },
  {
    id: "a5",
    type: "enrollment" as const,
    wallet: "9sLa...2Opw",
    courseId: "defi-protocols",
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: "a6",
    type: "lesson_complete" as const,
    wallet: "5nKb...8Gqt",
    courseId: "anchor-development",
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
  },
  {
    id: "a7",
    type: "enrollment" as const,
    wallet: "1vZp...4Duh",
    courseId: "web3-frontend",
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCourseId(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  loading,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  gradient: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-bold">{value}</p>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
          >
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { data: session, status: sessionStatus } = useSession();
  const { connected } = useWallet();

  const [courses, setCourses] = useState<OnChainCourse[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const allCourses = await fetchAllCourses();
        if (cancelled) return;

        setCourses(allCourses);

        const totalEnrollments = allCourses.reduce(
          (sum, c) => sum + (c.account.totalEnrollments ?? 0),
          0
        );
        const totalCompletions = allCourses.reduce(
          (sum, c) => sum + (c.account.totalCompletions ?? 0),
          0
        );

        setStats({
          totalCourses: allCourses.length,
          totalEnrollments,
          // XP minted: estimate from completions × average xpPerLesson × lessonCount
          totalXpMinted: allCourses.reduce(
            (sum, c) =>
              sum +
              c.account.totalCompletions *
                c.account.lessonCount *
                c.account.xpPerLesson,
            0
          ),
          // Learners who enrolled but haven't completed all lessons
          activeLearners: Math.max(0, totalEnrollments - totalCompletions),
        });
      } catch {
        // RPC unavailable — show zeros
        if (!cancelled) {
          setCourses([]);
          setStats({ totalCourses: 0, totalEnrollments: 0, totalXpMinted: 0, activeLearners: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [connected]);

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 flex justify-center">
        <div
          role="status"
          aria-label={tc("loading")}
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <EmptyState
          icon={ShieldAlert}
          title={t("signInRequired.title")}
          description={t("signInRequired.description")}
          action={
            <Link href="/auth/signin">
              <Button>{t("signInRequired.cta")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6 text-center">
          <Wallet className="mx-auto mb-4 h-10 w-10 text-primary/60" aria-hidden="true" />
          <h2 className="text-xl font-bold">{t("walletRequired.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {t("walletRequired.description")}
          </p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const statCards = [
    {
      icon: BookOpen,
      label: t("stats.totalCourses"),
      value: stats?.totalCourses ?? 0,
      gradient: "from-primary/15 to-primary/5",
    },
    {
      icon: Users,
      label: t("stats.totalEnrollments"),
      value: stats?.totalEnrollments ?? 0,
      gradient: "from-secondary/15 to-secondary/5",
    },
    {
      icon: Zap,
      label: t("stats.totalXpMinted"),
      value: formatXp(stats?.totalXpMinted ?? 0),
      gradient: "from-accent/15 to-accent/5",
    },
    {
      icon: TrendingUp,
      label: t("stats.activeLearners"),
      value: stats?.activeLearners ?? 0,
      gradient: "from-primary/15 to-secondary/5",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <a
          href="/studio"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t("manageContent")}
          </Button>
        </a>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course management table */}
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              {t("courses.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("courses.empty")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="pb-3 text-left font-medium text-muted-foreground">{t("courses.cols.courseId")}</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">{t("courses.cols.enrollments")}</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">{t("courses.cols.completions")}</th>
                      <th className="pb-3 text-right font-medium text-muted-foreground">{t("courses.cols.xpPerLesson")}</th>
                      <th className="pb-3 text-left font-medium text-muted-foreground">{t("courses.cols.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {courses.map((c) => (
                      <tr key={c.publicKey.toBase58()} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 font-medium">{formatCourseId(c.account.courseId)}</td>
                        <td className="py-3 text-right text-muted-foreground">{c.account.totalEnrollments}</td>
                        <td className="py-3 text-right text-muted-foreground">{c.account.totalCompletions}</td>
                        <td className="py-3 text-right text-muted-foreground">{c.account.xpPerLesson}</td>
                        <td className="py-3">
                          {c.account.isActive ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              {t("courses.active")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {t("courses.inactive")}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" aria-hidden="true" />
              {t("activity.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {SEED_ACTIVITIES.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
                >
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {activity.type === "enrollment" ? (
                      <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">
                      {activity.type === "enrollment"
                        ? t("activity.enrolled")
                        : t("activity.lessonCompleted")}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {activity.wallet}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatCourseId(activity.courseId)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {relativeTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
