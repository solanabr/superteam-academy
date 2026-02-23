"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface SkillRadarProps {
  xp: number;
  completedTracks?: number[];
}

const SKILLS = [
  { key: "smart_contracts", label: "Smart Contracts" },
  { key: "defi", label: "DeFi" },
  { key: "frontend", label: "Frontend" },
  { key: "security", label: "Security" },
  { key: "tooling", label: "Tooling" },
  { key: "theory", label: "Theory" },
];

export function SkillRadar({ xp, completedTracks = [] }: SkillRadarProps) {
  // Derive skill levels from XP and completed tracks
  // Each skill gets a base from total XP + bonus from track completion
  const baseLevel = Math.min(xp / 500, 60);
  const data = SKILLS.map((skill, i) => {
    const trackBonus = completedTracks.includes(i) ? 40 : 0;
    // Add slight variation so it looks organic
    const variance = ((i * 17 + 7) % 15) - 7;
    return {
      skill: skill.label,
      value: Math.min(Math.round(baseLevel + trackBonus + variance), 100),
    };
  });

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--border-primary)" strokeOpacity={0.4} />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          />
          <Radar
            dataKey="value"
            stroke="#9945FF"
            fill="#9945FF"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
