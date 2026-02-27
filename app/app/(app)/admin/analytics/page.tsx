"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Platform metrics and per-course stats"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total learners</CardTitle>
            <CardDescription>Wallets with XP &gt; 0 (all-time)</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{totalLearners}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total XP in circulation</CardTitle>
            <CardDescription>Sum of all learner XP</CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{totalXp.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leaderboard</CardTitle>
          <CardDescription>Top learners by XP (all-time)</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboardError && (
            <p className="text-sm text-destructive mb-4">{leaderboardError}</p>
          )}
          {leaderboardLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Rank</th>
                    <th className="text-left py-2 pr-4 font-medium">Wallet</th>
                    <th className="text-right py-2 pl-2 font-medium">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 100).map((e) => (
                    <tr key={e.wallet} className="border-b border-border/50">
                      <td className="py-2 pr-4 tabular-nums">{e.rank}</td>
                      <td className="py-2 pr-4 font-mono text-xs break-all">{e.wallet}</td>
                      <td className="text-right py-2 pl-2 tabular-nums">{e.xp.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {entries.length > 100 && (
                <p className="text-muted-foreground text-xs mt-2">Showing top 100</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-course stats</CardTitle>
          <CardDescription>Enrollments and completions from chain</CardDescription>
        </CardHeader>
        <CardContent>
          {courseList.length === 0 ? (
            <p className="text-muted-foreground text-sm">No courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Course ID</th>
                    <th className="text-right py-2 px-2">Enrollments</th>
                    <th className="text-right py-2 px-2">Completions</th>
                    <th className="text-right py-2 pl-2">Completion rate</th>
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
        </CardContent>
      </Card>
    </div>
  );
}
