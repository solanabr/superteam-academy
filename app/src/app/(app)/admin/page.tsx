"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";

interface OverviewStats {
  totalUsers: number;
  totalEnrollments: number;
  totalXP: number;
  activeLearners: number;
  recentSignups: { id: string; display_name: string | null; created_at: string }[];
  recentEnrollments: { id: string; course_title: string; started_at: string; display_name: string | null }[];
}

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchStats() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: totalUsers },
        { count: totalEnrollments },
        { data: xpData },
        { count: activeLearners },
        { data: recentSignups },
        { data: recentEnrollments },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("user_xp").select("total_xp"),
        supabase.from("user_xp").select("*", { count: "exact", head: true }).gte("last_active_date", sevenDaysAgo.split("T")[0]),
        supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("enrollments").select("id, course_title, started_at, profiles(display_name)").order("started_at", { ascending: false }).limit(10),
      ]);

      const totalXP = xpData?.reduce((sum, row) => sum + (row.total_xp || 0), 0) ?? 0;

      setStats({
        totalUsers: totalUsers ?? 0,
        totalEnrollments: totalEnrollments ?? 0,
        totalXP,
        activeLearners: activeLearners ?? 0,
        recentSignups: recentSignups ?? [],
        recentEnrollments: (recentEnrollments ?? []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          course_title: e.course_title as string,
          started_at: e.started_at as string,
          display_name: (e.profiles as Record<string, unknown> | null)?.display_name as string | null,
        })),
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("admin.totalUsers")} value={stats.totalUsers.toLocaleString()} />
        <StatCard label={t("admin.totalEnrollments")} value={stats.totalEnrollments.toLocaleString()} />
        <StatCard label={t("admin.totalXPAwarded")} value={stats.totalXP.toLocaleString()} />
        <StatCard label={t("admin.activeLearners")} value={stats.activeLearners.toLocaleString()} />
      </div>

      {/* Recent signups */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h2 className="text-lg font-semibold mb-4">{t("admin.recentSignups")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.name")}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.joined")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSignups.map((u) => (
                <tr key={u.id} className="border-b border-neutral-50 dark:border-neutral-800/50">
                  <td className="py-2.5 px-3 font-medium">{u.display_name || "—"}</td>
                  <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent enrollments */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <h2 className="text-lg font-semibold mb-4">{t("admin.recentEnrollments")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800">
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.name")}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.course")}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.enrolledDate")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentEnrollments.map((e) => (
                <tr key={e.id} className="border-b border-neutral-50 dark:border-neutral-800/50">
                  <td className="py-2.5 px-3 font-medium">{e.display_name || "—"}</td>
                  <td className="py-2.5 px-3">{e.course_title || "—"}</td>
                  <td className="py-2.5 px-3 text-neutral-500 dark:text-neutral-400">{new Date(e.started_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{label}</span>
      <p className="text-2xl font-semibold tracking-tight mt-2">{value}</p>
      {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
    </div>
  );
}
