"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Skill Score",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function SkillsRadar({
  data,
}: {
  data: Array<{ skill: string; value: number }>;
}) {
  return (
    <ChartContainer config={chartConfig} className="mx-auto h-52 w-full">
      <RadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
        <Radar
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.55}
        />
      </RadarChart>
    </ChartContainer>
  );
}
