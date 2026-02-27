"use client";

import { BookOpen, Users, Award, TrendingUp } from "lucide-react";
import { useAdminStats } from "@/lib/hooks/use-admin-stats";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-20 rounded bg-[var(--c-border-subtle)] mb-1" />
      <div className="h-3 w-16 rounded bg-[var(--c-border-subtle)]" />
    </div>
  );
}

export function StatsCards() {
  const { stats, loading } = useAdminStats();

  const cards = [
    {
      label: "Total Courses",
      value: stats ? String(stats.totalCourses) : "--",
      icon: BookOpen,
      change: stats
        ? `${stats.courseBreakdown.active} active`
        : "",
    },
    {
      label: "Active Learners",
      value: stats ? formatNumber(stats.activeLearners) : "--",
      icon: Users,
      change: stats && stats.activeLearners > 0
        ? `${stats.activeLearners} holders`
        : "0 holders",
    },
    {
      label: "Credentials Issued",
      value: stats ? formatNumber(stats.credentialsIssued) : "--",
      icon: Award,
      change: stats
        ? `${stats.completionRate}% rate`
        : "",
    },
    {
      label: "Total XP Distributed",
      value: stats ? formatNumber(stats.totalXpDistributed) : "--",
      icon: TrendingUp,
      change: stats && stats.xpByTrack.length > 0
        ? `${stats.xpByTrack.length} tracks`
        : "",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <card.icon className="h-5 w-5 text-[var(--c-text-2)]" />
            {loading ? (
              <div className="h-3 w-14 rounded bg-[var(--c-border-subtle)] animate-pulse" />
            ) : (
              <span className="font-mono text-xs text-[#00FFA3]">
                {card.change}
              </span>
            )}
          </div>
          {loading ? (
            <Skeleton />
          ) : (
            <>
              <p className="text-2xl font-bold text-[var(--c-text)] font-mono">
                {card.value}
              </p>
              <p className="text-xs text-[var(--c-text-2)] mt-1">
                {card.label}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
