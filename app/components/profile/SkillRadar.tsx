/**
 * @fileoverview Radar chart component for visualizing user skill aptitudes.
 */
"use client";

import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
	ResponsiveContainer,
} from "recharts";
import { SkillRadar as SkillRadarType } from "@/lib/data/credentials";

interface SkillRadarProps {
	/** Quantitative skill data for the five core dimensions (Rust, Anchor, etc.). */
	skills: SkillRadarType;
}

/**
 * SkillRadar Component
 * Renders a stylized radar chart representing user aptitudes using Recharts.
 */
export function SkillRadar({ skills }: SkillRadarProps) {
	const data = [
		{ subject: "Rust", A: skills.rust, fullMark: 100 },
		{ subject: "Anchor", A: skills.anchor, fullMark: 100 },
		{ subject: "Security", A: skills.security, fullMark: 100 },
		{ subject: "Frontend", A: skills.frontend, fullMark: 100 },
		{ subject: "Governance", A: skills.governance, fullMark: 100 },
	];

	return (
		<div className="border border-border p-6 bg-bg-surface relative h-[400px] flex flex-col overflow-hidden">
			{/* Subtle decorative elements */}
			<div className="absolute top-0 right-0 w-32 h-32 bg-[#14F195]/5 blur-[60px] pointer-events-none"></div>

			<span className="text-[10px] uppercase tracking-widest font-bold block mb-4 relative z-10">
				APTITUDE_RADAR
			</span>

			<div className="flex-1 w-full h-full min-h-[250px] relative z-10">
				<ResponsiveContainer width="100%" height="100%">
					<RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
						<PolarGrid
							stroke="var(--ink-primary)"
							strokeOpacity={0.15}
							gridType="polygon"
						/>
						<PolarAngleAxis
							dataKey="subject"
							tick={{
								fill: "var(--ink-secondary)",
								fontSize: 9,
								fontWeight: "600",
							}}
						/>
						<PolarRadiusAxis
							angle={90}
							domain={[0, 100]}
							tick={false}
							axisLine={false}
						/>
						<Radar
							name="User Skills"
							dataKey="A"
							stroke="#14F195"
							strokeWidth={2}
							fill="#14F195"
							fillOpacity={0.15}
							animationBegin={300}
							animationDuration={1500}
						/>
					</RadarChart>
				</ResponsiveContainer>
			</div>

			{/* Bottom Labeling */}
			<div className="mt-4 flex justify-between items-end border-t border-border pt-4">
				<div className="flex flex-col">
					<span className="text-[9px] text-ink-secondary uppercase tracking-[0.2em] mb-1">
						Total_Aptitude
					</span>
					<div className="flex items-baseline gap-1">
						<span className="font-display text-xl leading-none">
							{Math.round(
								(skills.rust +
									skills.anchor +
									skills.security +
									skills.frontend +
									skills.governance) /
									5,
							)}
						</span>
						<span className="text-[10px] opacity-40">/100</span>
					</div>
				</div>
				<div className="w-1.5 h-1.5 bg-[#14F195]"></div>
			</div>
		</div>
	);
}
