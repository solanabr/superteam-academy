"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";
import type { CourseTrackInfo } from "@/lib/sanity/queries";

// Maps Sanity trackId numbers to human-readable skill dimension labels.
// Add new entries here when new tracks are added in Sanity.
const TRACK_NAMES: Record<number, string> = {
  1: "Solana Core",
  2: "Rust",
  3: "Anchor",
  4: "Token Program",
  5: "DeFi",
  6: "NFTs",
};

// All skill dimensions always shown on the radar (in display order).
const ALL_TRACKS = [1, 2, 3, 4, 5, 6] as const;

interface SkillRadarChartProps {
  completedLessons: Record<string, Set<number>>;
  /**
   * Lightweight course metadata fetched from Sanity (id + trackId + lessonCount).
   * When provided, values are computed as:
   *   (lessons completed in track / total lessons in track) * 100
   * When omitted, all values are shown as 0.
   */
  courseTrackMap?: CourseTrackInfo[];
}

export function SkillRadarChart({ completedLessons, courseTrackMap }: SkillRadarChartProps) {
  const t = useTranslations("profile");

  // Build per-track completion stats when course metadata is available.
  const trackStats: Record<number, { completed: number; total: number }> = {};
  for (const tid of ALL_TRACKS) {
    trackStats[tid] = { completed: 0, total: 0 };
  }

  if (courseTrackMap && courseTrackMap.length > 0) {
    for (const course of courseTrackMap) {
      const tid = course.trackId;
      const stat = trackStats[tid];
      if (!stat) continue;
      const completedInCourse = completedLessons[course.onChainCourseId]?.size ?? 0;
      stat.completed += completedInCourse;
      stat.total += course.lessonCount;
    }
  }

  const data = ALL_TRACKS.map((tid) => {
    const stat = trackStats[tid] ?? { completed: 0, total: 0 };
    const value = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
    return { skill: TRACK_NAMES[tid], value };
  });

  const hasAnyProgress = data.some((d) => d.value > 0);

  if (!hasAnyProgress) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {t("skills.noSkills")}
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
          />
          <Radar
            name={t("skills.title")}
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
