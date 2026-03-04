"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";

interface AnalyticsData {
  xpPercentiles: { percentile: string; xp: number }[];
  streakStats: { activeUsers: number; avgStreak: number };
  enrollmentTrends: { week: string; count: number }[];
  achievementRates: { total: number; unlocked: number; rate: number };
}

export default function AdminAnalyticsPage() {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchAnalytics() {
      const [
        { data: xpData },
        { data: streakData },
        { data: enrollmentData },
      ] = await Promise.all([
        supabase.from("user_xp").select("total_xp, current_streak, last_active_date, achievements"),
        supabase.from("user_xp").select("current_streak, last_active_date"),
        supabase.from("enrollments").select("started_at"),
      ]);

      // XP percentiles
      const xpValues = (xpData ?? []).map((r) => r.total_xp).sort((a, b) => a - b);
      const percentiles = [25, 50, 75, 90, 99];
      const xpPercentiles = percentiles.map((p) => {
        const idx = Math.floor((p / 100) * xpValues.length);
        return { percentile: `P${p}`, xp: xpValues[idx] ?? 0 };
      });

      // Streak stats
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const activeStreakUsers = (streakData ?? []).filter((r) => r.last_active_date && r.last_active_date >= sevenDaysAgo);
      const avgStreak = activeStreakUsers.length > 0
        ? Math.round(activeStreakUsers.reduce((sum, r) => sum + r.current_streak, 0) / activeStreakUsers.length)
        : 0;

      // Enrollment trends (by week, last 8 weeks)
      const weekMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * 7);
        const weekKey = d.toISOString().split("T")[0];
        weekMap[weekKey] = 0;
      }

      (enrollmentData ?? []).forEach((e) => {
        const date = new Date(e.started_at);
        // Find which week bucket
        const weekKeys = Object.keys(weekMap);
        for (let i = weekKeys.length - 1; i >= 0; i--) {
          if (date.toISOString().split("T")[0] >= weekKeys[i]) {
            weekMap[weekKeys[i]]++;
            break;
          }
        }
      });

      const enrollmentTrends = Object.entries(weekMap).map(([week, count]) => ({
        week: new Date(week).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count,
      }));

      // Achievement rates (using bitmask count)
      const totalUsers = (xpData ?? []).length;
      const usersWithAchievements = (xpData ?? []).filter((r) => r.achievements > 0).length;

      setData({
        xpPercentiles,
        streakStats: { activeUsers: activeStreakUsers.length, avgStreak },
        enrollmentTrends,
        achievementRates: {
          total: totalUsers,
          unlocked: usersWithAchievements,
          rate: totalUsers > 0 ? Math.round((usersWithAchievements / totalUsers) * 100) : 0,
        },
      });
      setLoading(false);
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        {/* XP Distribution */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">{t("admin.xpDistribution")}</h2>
          <div className="space-y-3">
            {data.xpPercentiles.map((p) => (
              <div key={p.percentile} className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">{p.percentile}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all"
                      style={{ width: `${Math.min(100, data.xpPercentiles[data.xpPercentiles.length - 1]?.xp ? (p.xp / data.xpPercentiles[data.xpPercentiles.length - 1].xp) * 100 : 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono font-medium w-20 text-right">{p.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Stats */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">{t("admin.streakStats")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.activeUsers")}</span>
              <p className="text-2xl font-semibold mt-1">{data.streakStats.activeUsers}</p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.avgStreak")}</span>
              <p className="text-2xl font-semibold mt-1">{data.streakStats.avgStreak} {t("dashboard.days")}</p>
            </div>
          </div>
        </div>

        {/* Enrollment Trends */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">{t("admin.enrollmentTrends")}</h2>
          <div className="space-y-2">
            {data.enrollmentTrends.map((w) => {
              const maxCount = Math.max(...data.enrollmentTrends.map((t) => t.count), 1);
              return (
                <div key={w.week} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 w-16 flex-shrink-0">{w.week}</span>
                  <div className="flex-1 h-5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all"
                      style={{ width: `${(w.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono w-8 text-right">{w.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Unlock Rates */}
        <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-semibold mb-4">{t("admin.achievementRates")}</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-neutral-100 dark:stroke-neutral-800"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  className="stroke-neutral-900 dark:stroke-white"
                  strokeWidth="3"
                  strokeDasharray={`${data.achievementRates.rate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold">{data.achievementRates.rate}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm"><span className="font-medium">{data.achievementRates.unlocked}</span> <span className="text-neutral-500 dark:text-neutral-400">of {data.achievementRates.total} users</span></p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">have unlocked at least one achievement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
