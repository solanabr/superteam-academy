'use client';

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';

interface Skill {
    subject: string;
    A: number;
    fullMark: number;
}

interface SkillRadarProps {
    skills?: Skill[];
}

// Default dummy data if none provided
const defaultSkills: Skill[] = [
    { subject: 'Rust', A: 85, fullMark: 100 },
    { subject: 'Anchor', A: 70, fullMark: 100 },
    { subject: 'DeFi', A: 60, fullMark: 100 },
    { subject: 'Frontend', A: 90, fullMark: 100 },
    { subject: 'NFTs', A: 75, fullMark: 100 },
    { subject: 'Security', A: 40, fullMark: 100 },
];

export function SkillRadar({ skills = defaultSkills }: SkillRadarProps) {
    return (
        <div className="w-full h-[300px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-4 self-start w-full">Skills Breakdown</h3>
            <ResponsiveContainer width="100%" height="85%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skills}>
                    <PolarGrid stroke="#e5e7eb" strokeOpacity={0.2} />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Skills"
                        dataKey="A"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
