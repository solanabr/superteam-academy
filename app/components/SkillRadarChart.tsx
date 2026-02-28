'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface SkillData {
  skill: string;
  value: number;
  fullMark: number;
}

export default function SkillRadarChart({ data }: { data: SkillData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#374151" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Skills"
          dataKey="value"
          stroke="#7c3aed"
          fill="url(#radarGradient)"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <defs>
          <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      </RadarChart>
    </ResponsiveContainer>
  );
}
