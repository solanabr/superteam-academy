"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app";
import { useAllCourses } from "@/hooks";
import type { LeaderboardEntry } from "@/lib/services/learning-progress";

type CourseAccount = {
  courseId: string;
  totalEnrollments: number;
  totalCompletions: number;
  isActive: boolean;
  xpPerLesson: number;
  lessonCount: number;
};

function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/leaderboard?timeframe=all-time")
      .then((res) => res.json())
      .then((data: { entries?: LeaderboardEntry[]; error?: string }) => {
        if (cancelled) return;
        if (data.entries) setEntries(data.entries);
        if (data.error) setError(data.error);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { entries, error, loading };
}

export default function AdminAnalyticsPage() {
  const { data: courses } = useAllCourses();
  const { entries, error: leaderboardError, loading: leaderboardLoading } = useLeaderboard();

  const totalLearners = entries.length;
  const totalXp = entries.reduce((sum, e) => sum + e.xp, 0);
  const courseList = (courses ?? []).map((c) => c.account as CourseAccount);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Platform metrics and per-course stats"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Total learners</h2>
          <p className="font-game text-muted-foreground text-sm mb-3">
            Wallets with XP &gt; 0 (all-time)
          </p>
          {leaderboardLoading ? (
            <p className="font-game text-muted-foreground text-sm">Loading…</p>
          ) : (
            <p className="font-game text-2xl sm:text-3xl tabular-nums text-yellow-400">{totalLearners}</p>
          )}
        </div>
        <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
          <h2 className="font-game text-xl mb-1">Total XP in circulation</h2>
          <p className="font-game text-muted-foreground text-sm mb-3">
            Sum of all learner XP
          </p>
          {leaderboardLoading ? (
            <p className="font-game text-muted-foreground text-sm">Loading…</p>
          ) : (
            <p className="font-game text-2xl sm:text-3xl tabular-nums text-yellow-400">{totalXp.toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
        <h2 className="font-game text-xl mb-1">Leaderboard</h2>
        <p className="font-game text-muted-foreground text-sm mb-4">
          Top learners by XP (all-time)
        </p>
        {leaderboardError && (
          <p className="font-game text-sm text-destructive mb-4">{leaderboardError}</p>
        )}
        {leaderboardLoading ? (
          <p className="font-game text-muted-foreground text-sm">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="font-game text-muted-foreground text-sm">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-game">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 pr-4 font-game">Rank</th>
                  <th className="text-left py-2 pr-4 font-game">Wallet</th>
                  <th className="text-right py-2 pl-2 font-game">XP</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 100).map((e) => (
                  <tr key={e.wallet} className="border-b border-border/50">
                    <td className="py-2 pr-4 tabular-nums">{e.rank}</td>
                    <td className="py-2 pr-4 font-mono text-xs break-all">{e.wallet}</td>
                    <td className="text-right py-2 pl-2 tabular-nums text-yellow-400">{e.xp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 100 && (
              <p className="font-game text-muted-foreground text-sm mt-2">Showing top 100</p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 rounded-2xl border-4 border-border bg-card">
        <h2 className="font-game text-xl mb-1">Per-course stats</h2>
        <p className="font-game text-muted-foreground text-sm mb-4">
          Enrollments and completions from chain
        </p>
        {courseList.length === 0 ? (
          <p className="font-game text-muted-foreground text-sm">No courses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-game">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-2 pr-4 font-game">Course ID</th>
                  <th className="text-right py-2 px-2 font-game">Enrollments</th>
                  <th className="text-right py-2 px-2 font-game">Completions</th>
                  <th className="text-right py-2 pl-2 font-game">Completion rate</th>
                </tr>
              </thead>
              <tbody>
                {courseList.map((acc) => {
                  const rate =
                    acc.totalEnrollments > 0
                      ? ((acc.totalCompletions / acc.totalEnrollments) * 100).toFixed(1)
                      : "—";
                  return (
                    <tr key={acc.courseId} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-mono">{acc.courseId}</td>
                      <td className="text-right py-2 px-2 tabular-nums">
                        {acc.totalEnrollments}
                      </td>
                      <td className="text-right py-2 px-2 tabular-nums">
                        {acc.totalCompletions}
                      </td>
                      <td className="text-right py-2 pl-2 tabular-nums">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
