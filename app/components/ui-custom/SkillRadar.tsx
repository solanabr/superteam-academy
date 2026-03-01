"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const skills = [
  { skill: "Rust", value: 40 },
  { skill: "Anchor", value: 30 },
  { skill: "Web3.js", value: 70 },
  { skill: "Tokens", value: 50 },
  { skill: "NFTs", value: 35 },
  { skill: "DeFi", value: 25 },
  { skill: "PDAs", value: 45 },
  { skill: "Security", value: 20 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0a0a0a] border border-[#9945ff]/30 px-3 py-2">
        <p className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest">
          {payload[0].payload.skill}
        </p>
        <p className="text-[10px] font-mono text-[#f5f5f0]">
          {payload[0].value}% proficiency
        </p>
      </div>
    );
  }
  return null;
};

export function SkillRadar({ solvedChallenges = 0, completedCourses = 0 }: {
  solvedChallenges?: number;
  completedCourses?: number;
}) {
  // Dynamic skill values based on activity
  const dynamicSkills = [
    { skill: "Rust", value: Math.min(100, 20 + completedCourses * 10) },
    { skill: "Anchor", value: Math.min(100, 15 + completedCourses * 8) },
    { skill: "Web3.js", value: Math.min(100, 40 + solvedChallenges * 5) },
    { skill: "Tokens", value: Math.min(100, 25 + solvedChallenges * 4) },
    { skill: "NFTs", value: Math.min(100, 20 + completedCourses * 7) },
    { skill: "DeFi", value: Math.min(100, 10 + completedCourses * 5) },
    { skill: "PDAs", value: Math.min(100, 15 + solvedChallenges * 6) },
    { skill: "Security", value: Math.min(100, 10 + completedCourses * 4) },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">// Skill Map</div>
          <div className="font-display font-black text-2xl uppercase">Your <span className="text-[#9945ff]">Expertise</span></div>
        </div>
        <div className="flex-1 h-px bg-[#1a1a1a]" />
      </div>

      <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-6">
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={dynamicSkills} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid
              stroke="#1a1a1a"
              strokeWidth={1}
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={{
                fill: "#444",
                fontSize: 10,
                fontFamily: "Space Mono, monospace",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="#9945ff"
              fill="#9945ff"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Skill badges */}
        <div className="grid grid-cols-4 gap-2 mt-4 border-t border-[#1a1a1a] pt-4">
          {dynamicSkills.map((s) => (
            <div key={s.skill} className="text-center">
              <div className="text-[9px] font-mono text-[#444] uppercase tracking-widest mb-1">{s.skill}</div>
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9945ff] to-[#14f195] rounded-full transition-all"
                  style={{ width: `${s.value}%` }}
                />
              </div>
              <div className="text-[9px] font-mono text-[#9945ff] mt-1">{s.value}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}