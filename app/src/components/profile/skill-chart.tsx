"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptySkillsIllustration } from "@/components/icons";

function ChartLoadingPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-52 w-52 rounded-full" />
    </div>
  );
}

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: ChartLoadingPlaceholder },
);
const RadarChart = dynamic(
  () => import("recharts").then((mod) => mod.RadarChart),
  { ssr: false },
);
const PolarGrid = dynamic(
  () => import("recharts").then((mod) => mod.PolarGrid),
  { ssr: false },
);
const PolarAngleAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarAngleAxis),
  { ssr: false },
);
const PolarRadiusAxis = dynamic(
  () => import("recharts").then((mod) => mod.PolarRadiusAxis),
  { ssr: false },
);
const Radar = dynamic(() => import("recharts").then((mod) => mod.Radar), {
  ssr: false,
});

export interface SkillDataPoint {
  skill: string;
  value: number;
}

interface SkillChartProps {
  skillData: SkillDataPoint[];
  title: string;
  emptyMessage: string;
}

export function SkillChart({
  skillData,
  title,
  emptyMessage,
}: SkillChartProps) {
  const hasData = skillData.some((s) => s.value > 0);

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {hasData ? (
        <>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Proficiency"
                  dataKey="value"
                  stroke="#4a8c5c"
                  fill="#4a8c5c"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {skillData.map((s) => (
              <span key={s.skill}>
                {s.skill}:{" "}
                <span className="font-semibold text-foreground">{s.value}</span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          illustration={<EmptySkillsIllustration className="h-full w-full" />}
          title={emptyMessage}
          compact
        />
      )}
    </section>
  );
}
