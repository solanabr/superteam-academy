"use client";

import { Sparkline, MiniBarChart, ProgressRing } from "./charts";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/types/admin";

interface OverviewChartsProps {
  data: AnalyticsData | null;
  loading: boolean;
}

const activityLabels: Record<string, string> = {
  lesson_completed: "Lessons",
  course_enrolled: "Enrollments",
  course_completed: "Completions",
  achievement_earned: "Achievements",
  xp_earned: "XP Earned",
  credential_issued: "Credentials",
  comment_posted: "Comments",
  helped_learner: "Helped",
};

export function OverviewCharts({ data, loading }: OverviewChartsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const activityBars = Object.entries(data.activityTypeBreakdown)
    .map(([type, count]) => ({
      label: activityLabels[type] ?? type,
      value: count,
      color: "bg-primary/70",
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Signups timeline */}
      <div className="rounded-xl border bg-card p-5">
        <Sparkline
          data={data.timelines.signups}
          label="New Users (30 days)"
          color="stroke-blue-500"
          height={50}
        />
      </div>

      {/* Enrollments timeline */}
      <div className="rounded-xl border bg-card p-5">
        <Sparkline
          data={data.timelines.enrollments}
          label="Enrollments (30 days)"
          color="stroke-emerald-500"
          height={50}
        />
      </div>

      {/* Completions timeline */}
      <div className="rounded-xl border bg-card p-5">
        <Sparkline
          data={data.timelines.completions}
          label="Completions (30 days)"
          color="stroke-purple-500"
          height={50}
        />
      </div>

      {/* Completion rate ring */}
      <div className="rounded-xl border bg-card p-5 flex items-center justify-center gap-6">
        <ProgressRing
          value={data.overview.completionRate}
          label="Completion Rate"
          color="stroke-emerald-500"
        />
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-muted-foreground">Enrolled</p>
            <p className="font-semibold">{data.overview.totalEnrollments}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Completed</p>
            <p className="font-semibold">{data.overview.totalCompletions}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Finalized</p>
            <p className="font-semibold">{data.overview.totalFinalizations}</p>
          </div>
        </div>
      </div>

      {/* Activity type breakdown */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-3">Activity Breakdown (30 days)</p>
        {activityBars.length > 0 ? (
          <MiniBarChart data={activityBars} height={110} />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
        )}
      </div>

      {/* Difficulty distribution */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs text-muted-foreground mb-3">Course Difficulty Distribution</p>
        <MiniBarChart
          data={[
            {
              label: "Beginner",
              value: data.difficultyDistribution.beginner,
              color: "bg-emerald-500",
            },
            {
              label: "Intermediate",
              value: data.difficultyDistribution.intermediate,
              color: "bg-amber-500",
            },
            {
              label: "Advanced",
              value: data.difficultyDistribution.advanced,
              color: "bg-red-500",
            },
          ]}
          height={110}
        />
      </div>
    </div>
  );
}
