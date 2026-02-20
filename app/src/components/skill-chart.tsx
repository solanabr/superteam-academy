// app/src/components/skill-chart.tsx
"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

// Mock data (в реальном проекте - на основе пройденных курсов)
const data = [
  { subject: "Rust", A: 80, fullMark: 150 },
  { subject: "Anchor", A: 98, fullMark: 150 },
  { subject: "Frontend", A: 86, fullMark: 150 },
  { subject: "Security", A: 99, fullMark: 150 },
  { subject: "DeFi", A: 65, fullMark: 150 },
];

export function SkillChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
            </linearGradient>
        </defs>
        <PolarGrid stroke="hsl(var(--muted-foreground))" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 14 }} />
        <Radar
          name="Skills"
          dataKey="A"
          stroke="#8884d8"
          fill="url(#colorUv)"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}