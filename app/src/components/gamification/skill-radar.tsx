"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface Skill {
  name: string;
  value: number;
  fullMark: number;
}

interface SkillRadarProps {
  skills?: Skill[];
}

const defaultSkills: Skill[] = [
  { name: "Rust", value: 0, fullMark: 100 },
  { name: "Anchor", value: 0, fullMark: 100 },
  { name: "Frontend", value: 0, fullMark: 100 },
  { name: "Token-2022", value: 0, fullMark: 100 },
  { name: "Security", value: 0, fullMark: 100 },
  { name: "DeFi", value: 0, fullMark: 100 },
];

export function SkillRadar({ skills = defaultSkills }: SkillRadarProps) {
  // Derive skills from course progress if default
  const data = skills.length > 0 ? skills : defaultSkills;

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-semibold mb-2">Skill Map</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
