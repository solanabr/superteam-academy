'use client';

/**
 * Skill chart — visual bar chart showing skill areas from earned credentials.
 * CSS-based bar chart, no charting library needed.
 */

import { Zap } from 'lucide-react';

interface SkillChartProps {
    skills: { name: string; level: number; maxLevel: number }[];
}

export function SkillChart({ skills }: SkillChartProps) {
    if (skills.length === 0) {
        return (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--profile-center-muted-bg)', border: '1px solid var(--profile-center-muted-border)' }}>
                <Zap className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--profile-center-sub)' }} />
                <p className="text-sm font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                    Complete courses to build your skill profile
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {skills.map((skill) => {
                const pct = Math.min(100, (skill.level / skill.maxLevel) * 100);
                return (
                    <div key={skill.name}>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-supreme" style={{ color: 'var(--profile-center-text)' }}>{skill.name}</span>
                            <span className="text-xs font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                                Lv.{skill.level}/{skill.maxLevel}
                            </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--profile-center-muted-bg)' }}>
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-green-emerald to-emerald-400 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** @deprecated Use SkillChart instead */
export const SkillRadar = SkillChart;
