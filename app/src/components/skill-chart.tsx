// app/src/components/skill-chart.tsx
"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

// Принимаем XP как проп
export function SkillChart({ xp }: { xp: number }) {
  
  // Простая логика: чем больше XP, тем больше скиллов
  // Максимум 1000 XP для полной диаграммы в начале
  const ratio = Math.min(xp / 1000, 1); 

  const data = [
    { subject: "Rust", A: 20 + (80 * ratio), fullMark: 100 },
    { subject: "Anchor", A: 10 + (90 * ratio), fullMark: 100 },
    { subject: "Frontend", A: 50 + (30 * ratio), fullMark: 100 }, // Фронтенд обычно знают лучше
    { subject: "Security", A: 5 + (70 * ratio), fullMark: 100 },
    { subject: "DeFi", A: 0 + (60 * ratio), fullMark: 100 },
  ];
  
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