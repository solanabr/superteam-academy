"use client";

import {
  Users,
  BookOpen,
  Zap,
  Award,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatXP } from "@/lib/utils";
import type { PlatformSummary, ActiveUsers } from "@/lib/admin-analytics";

interface AnalyticsOverviewProps {
  summary: PlatformSummary;
  activeUsers: ActiveUsers;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail?: string;
  accent?: string;
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  accent = "text-st-green",
}: MetricCardProps) {
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

export function AnalyticsOverview({
  summary,
  activeUsers,
}: AnalyticsOverviewProps) {
  const t = useTranslations("admin.analytics");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        icon={<Users className="h-5 w-5" />}
        label={t("totalUsers")}
        value={summary.totalUsers.toLocaleString()}
      />
      <MetricCard
        icon={<Activity className="h-5 w-5" />}
        label={t("dau")}
        value={activeUsers.dau.toLocaleString()}
        detail={`${t("wau")}: ${activeUsers.wau.toLocaleString()} / ${t("mau")}: ${activeUsers.mau.toLocaleString()}`}
        accent="text-brazil-teal"
      />
      <MetricCard
        icon={<BookOpen className="h-5 w-5" />}
        label={t("totalEnrollments")}
        value={summary.totalEnrollments.toLocaleString()}
        accent="text-level"
      />
      <MetricCard
        icon={<TrendingUp className="h-5 w-5" />}
        label={t("completionRate")}
        value={`${summary.avgCompletionRate}%`}
        detail={`${summary.totalCompletions.toLocaleString()} ${t("completed")}`}
        accent="text-brazil-green"
      />
      <MetricCard
        icon={<Zap className="h-5 w-5" />}
        label={t("totalXP")}
        value={`${formatXP(summary.totalXP)} XP`}
        accent="text-xp"
      />
      <MetricCard
        icon={<Award className="h-5 w-5" />}
        label={t("achievementsClaimed")}
        value={summary.totalAchievementsClaimed.toLocaleString()}
        accent="text-achievement"
      />
    </div>
  );
}
