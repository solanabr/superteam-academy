"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { CloseEnrollmentButton } from "@/components/course/CloseEnrollmentButton";
import { getLearningProgressService } from "@/lib/services/learning-progress";
import { getOnChainReadService } from "@/lib/services/onchain-read";
import { createClient } from "@/lib/supabase/client";
import {
  type UserXPSummary,
  type Enrollment,
  type Achievement,
  type StreakData,
  type Credential,
  levelProgress,
  levelToMinXp,
  xpToLevel,
} from "@/lib/types/learning";

interface LinkedWallet {
  id: string;
  wallet_address: string;
  is_primary: boolean;
}

interface XPEvent {
  id: string;
  xp_amount: number;
  source: string;
  created_at: string;
  description?: string;
}

interface DashboardData {
  localXP: UserXPSummary | null;
  onChainXP: number | null;
  enrollments: Enrollment[];
  achievements: Achievement[];
  streak: StreakData | null;
  credentials: Credential[];
  linkedWallets: LinkedWallet[];
  recentActivity: XPEvent[];
  allCourseCount: number;
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchDashboardData() {
      setLoading(true);
      const currentUser = user;
      if (!currentUser) return;

      const supabase = createClient();
      const learningService = getLearningProgressService();
      const onChainService = getOnChainReadService();

      try {
        const [
          localXP,
          enrollments,
          achievements,
          streak,
          walletsResult,
          activityResult,
        ] = await Promise.all([
          learningService.getXP(currentUser.id),
          learningService.getEnrollments(currentUser.id),
          learningService.getAchievements(currentUser.id),
          learningService.getStreak(currentUser.id),
          supabase
            .from("linked_wallets")
            .select("id, wallet_address, is_primary")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("xp_events")
            .select("id, xp_amount, source, created_at, description")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        const linkedWallets = walletsResult.data || [];
        const primaryWallet = linkedWallets.find((w) => w.is_primary);
        const recentActivity = (activityResult.data || []) as XPEvent[];

        let onChainXP: number | null = null;
        let credentials: Credential[] = [];

        if (primaryWallet) {
          try {
            [onChainXP, credentials] = await Promise.all([
              onChainService.getXPBalance(primaryWallet.wallet_address),
              onChainService.getCredentials(primaryWallet.wallet_address),
            ]);
          } catch (error) {
            console.error("Error fetching on-chain data:", error);
          }
        }

        setData({
          localXP,
          onChainXP,
          enrollments,
          achievements,
          streak,
          credentials,
          linkedWallets,
          recentActivity,
          allCourseCount: 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <h1 className="text-2xl font-semibold">Sign in to access your dashboard</h1>
        <Link href="/auth/sign-in" className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">
          {t("common.signIn")}
        </Link>
      </div>
    );
  }

  const rawName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
  const firstSegment = rawName.split(/[\s._-]/)[0];
  const cleaned = firstSegment.replace(/\d+$/g, "");
  const firstName = cleaned
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
    : "Learner";

  const unlockedAchievements = data?.achievements.filter((a) => a.unlockedAt !== null) || [];

  const hasLinkedWallet = (data?.linkedWallets.length ?? 0) > 0;
  const primaryWallet = data?.linkedWallets.find((w) => w.is_primary);

  // Prefer on-chain XP when available
  const effectiveXP = data?.onChainXP ?? data?.localXP?.totalXp ?? 0;
  const effectiveLevel = xpToLevel(effectiveXP);
  const effectiveXpToNext = (() => {
    const nextLevelMin = levelToMinXp(effectiveLevel + 1);
    return nextLevelMin - effectiveXP;
  })();
  const progressPct = levelProgress(effectiveXP);

  const handleEnrollmentClosed = (courseId: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        enrollments: prev.enrollments.filter((enrollment) => enrollment.courseId !== courseId),
      };
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{t("dashboard.welcomeBack")}</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{firstName}</h1>
        </div>
        <Link href="/courses" className="self-start px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 hover:scale-105 transition-all duration-300 shadow-lg shadow-neutral-200/50 dark:shadow-none">
          {t("common.browseCourses")}
        </Link>
      </div>

      {/* Wallet Connection Banner */}
      {!hasLinkedWallet && (
        <div className="p-4 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Connect your wallet</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Link a Solana wallet to track XP on-chain and receive credentials</p>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-full hover:bg-amber-700 transition-colors"
          >
            Link Wallet
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("dashboard.totalXP")}
          value={effectiveXP.toLocaleString()}
          subtitle={data?.onChainXP !== null ? "On-chain" : "Local"}
          highlight={data?.onChainXP !== null}
        />
        <StatCard
          label={t("dashboard.level")}
          value={String(effectiveLevel)}
          subtitle={`${Math.round(progressPct)}% ${t("dashboard.toNext")}`}
        />
        <StatCard
          label={t("dashboard.currentStreak")}
          value={`${data?.streak?.currentStreak ?? 0} ${t("dashboard.days")}`}
          subtitle={t("dashboard.best", { n: data?.streak?.longestStreak ?? 0 })}
        />
        <StatCard
          label={t("dashboard.achievements")}
          value={`${unlockedAchievements.length}/${data?.achievements.length || 0}`}
        />
      </div>

      {/* Level Progress */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t("dashboard.levelProgress", { level: effectiveLevel })}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{t("dashboard.xpToLevel", { xp: effectiveXpToNext, level: effectiveLevel + 1 })}</span>
        </div>
        <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-neutral-400">{levelToMinXp(effectiveLevel).toLocaleString()} XP</span>
          <span className="text-[11px] text-neutral-400">{levelToMinXp(effectiveLevel + 1).toLocaleString()} XP</span>
        </div>
      </div>

      {/* On-Chain Credentials */}
      {data?.credentials && data.credentials.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">On-Chain Credentials</h2>
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Verified
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.credentials.map((credential) => (
              <Link href={`/certificates/${credential.mintAddress}`} key={credential.mintAddress} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 mb-3 overflow-hidden">
                  {credential.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={credential.imageUrl}
                      alt={credential.trackName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">&#127942;</div>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{credential.trackName}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Level {credential.level}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Wallet Info */}
      {hasLinkedWallet && primaryWallet && (
        <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Linked Wallet</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                {primaryWallet.wallet_address.slice(0, 6)}...{primaryWallet.wallet_address.slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">On-Chain XP</p>
              <p className="text-lg font-semibold">{data?.onChainXP?.toLocaleString() ?? "--"}</p>
            </div>
          </div>
          {data?.onChainXP !== null && data?.localXP && data.onChainXP !== data.localXP.totalXp && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <span className="font-medium">Sync needed:</span> Your local XP ({data.localXP.totalXp.toLocaleString()}) differs from on-chain XP ({data.onChainXP.toLocaleString()}). Complete a lesson to sync.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Streak Calendar */}
      {data?.streak && data.streak.streakHistory.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">{t("dashboard.activity")}</h2>
          <div className="flex gap-1 flex-wrap">
            {data.streak.streakHistory.map((day) => (
              <div key={day.date} title={`${day.date}: ${day.active ? "Active" : "Inactive"}`} className={`w-6 h-6 rounded-sm transition-colors ${day.active ? "bg-neutral-900 dark:bg-white" : "bg-neutral-100 dark:bg-neutral-800"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-neutral-50 dark:border-neutral-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.description || event.source}</p>
                    <p className="text-xs text-neutral-400">
                      {formatRelativeTime(event.created_at)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  +{event.xp_amount} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("dashboard.myCourses")}</h2>
          <Link href="/courses" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">{t("common.viewAll")} &rarr;</Link>
        </div>
        {data?.enrollments.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">{t("dashboard.noCourses")}</p>
            <Link href="/courses" className="inline-block px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">{t("common.exploreCourses")}</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.enrollments.map((e) => (
              <EnrollmentCard
                key={e.id}
                enrollment={e}
                onClosed={() => handleEnrollmentClosed(e.courseId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommended Courses */}
      {data?.enrollments && data.enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recommended Next</h2>
            <Link href="/courses" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Browse all &rarr;</Link>
          </div>
          <div className="p-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">
              Continue your learning journey with more Solana courses
            </p>
            <Link href="/courses" className="inline-block px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-xs font-semibold hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all">
              Explore Courses
            </Link>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("dashboard.achievements")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data?.achievements.slice(0, 12).map((a) => (
            <div key={a.id} className={`p-4 rounded-2xl border text-center transition-all duration-300 ${a.unlockedAt ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-400"}`}>
              <div className="text-2xl mb-2">{ACHIEVEMENT_ICONS[a.icon] || "*"}</div>
              <p className="text-[11px] font-medium leading-tight">{a.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ---------- Sub-components ---------- */

function StatCard({
  label,
  value,
  subtitle,
  highlight = false
}: {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 rounded-2xl border transition-colors ${highlight ? 'border-green-500 dark:border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900'} hover:border-neutral-300 dark:hover:border-neutral-700`}>
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{label}</span>
      <p className="text-2xl font-semibold tracking-tight mt-2">{value}</p>
      {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  onClosed,
}: {
  enrollment: Enrollment;
  onClosed?: () => void;
}) {
  const href = enrollment.courseSlug
    ? `/courses/${enrollment.courseSlug}`
    : `/courses`;

  return (
    <div className="group block">
      <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-sm leading-tight group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
            {enrollment.courseTitle || `Course ${enrollment.courseId.slice(0, 8)}`}
          </h3>
          <span className="text-xs font-mono text-neutral-400">{enrollment.completionPercent}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${enrollment.completionPercent}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
          <span>{enrollment.completedAt ? "Completed" : `Started ${new Date(enrollment.startedAt).toLocaleDateString()}`}</span>
        </div>
        <div className="pt-3 flex items-center justify-between gap-2">
          <Link
            href={href}
            className="px-3 py-1.5 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-full transition-colors"
          >
            Open Course
          </Link>
          <CloseEnrollmentButton
            courseId={enrollment.courseId}
            courseSlug={enrollment.courseSlug}
            onClosed={onClosed}
            className="px-3 py-1.5 text-[11px] font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
  footprints: "FP",
  "graduation-cap": "GC",
  timer: "TM",
  "book-open": "BK",
  milestone: "MS",
  flame: "FL",
  "flame-kindling": "FK",
  crown: "CR",
  code: "CD",
  anchor: "AN",
  layers: "LY",
  coins: "CN",
  shield: "SH",
  "heart-handshake": "HH",
  trophy: "TR",
  rocket: "RK",
  bug: "BG",
  star: "ST",
};
