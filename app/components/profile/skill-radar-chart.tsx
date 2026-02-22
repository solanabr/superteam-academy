"use client";

interface SkillData {
	label: string;
	value: number; // 0-100
}

interface SkillRadarChartProps {
	skills: SkillData[];
	size?: number;
}

export function SkillRadarChart({ skills, size = 240 }: SkillRadarChartProps) {
	if (skills.length < 3) return null;

	const cx = size / 2;
	const cy = size / 2;
	const radius = size * 0.38;
	const angleStep = (2 * Math.PI) / skills.length;
	const levels = [20, 40, 60, 80, 100];

	const getPoint = (index: number, value: number) => {
		const angle = angleStep * index - Math.PI / 2;
		const r = (value / 100) * radius;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
	};

	const gridPolygons = levels.map((level) => {
		const points = skills
			.map((_, i) => {
				const { x, y } = getPoint(i, level);
				return `${x},${y}`;
			})
			.join(" ");
		return points;
	});

	const dataPoints = skills.map((s, i) => getPoint(i, s.value));
	const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

	return (
		<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
			<h3 className="text-sm font-semibold">Skill Breakdown</h3>
			<svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-60 mx-auto">
				{/* Grid levels */}
				{gridPolygons.map((points, i) => (
					<polygon
						key={i}
						points={points}
						fill="none"
						stroke="currentColor"
						strokeWidth="0.5"
						className="text-border/40"
					/>
				))}

				{/* Axis lines */}
				{skills.map((_, i) => {
					const { x, y } = getPoint(i, 100);
					return (
						<line
							key={i}
							x1={cx}
							y1={cy}
							x2={x}
							y2={y}
							stroke="currentColor"
							strokeWidth="0.5"
							className="text-border/30"
						/>
					);
				})}

				{/* Data polygon */}
				<polygon
					points={dataPolygon}
					className="fill-primary/15 stroke-primary"
					strokeWidth="2"
				/>

				{/* Data points */}
				{dataPoints.map((p, i) => (
					<circle key={i} cx={p.x} cy={p.y} r="3" className="fill-primary" />
				))}

				{/* Labels */}
				{skills.map((s, i) => {
					const { x, y } = getPoint(i, 120);
					return (
						<text
							key={i}
							x={x}
							y={y}
							textAnchor="middle"
							dominantBaseline="middle"
							className="fill-muted-foreground text-[9px]"
						>
							{s.label}
						</text>
					);
				})}
			</svg>
		</div>
	);
}

/** Derive skill data from enrolled courses' categories */
export function deriveSkillsFromCourses(
	courses: Array<{
		id: string;
		status: "completed" | "in_progress" | "not_started";
		progress?: { completedLessons: number; totalLessons: number };
	}>
): SkillData[] {
	// Map course IDs to skill categories heuristically
	const categoryMap: Record<string, string> = {
		solana: "Core Solana",
		anchor: "Anchor",
		token: "Tokens",
		defi: "DeFi",
		nft: "NFT & Metaplex",
		security: "Security",
		frontend: "Frontend",
	};

	const skillScores: Record<string, { total: number; earned: number }> = {};
	for (const cat of Object.values(categoryMap)) {
		skillScores[cat] = { total: 0, earned: 0 };
	}

	for (const course of courses) {
		const idLower = course.id.toLowerCase();
		let matched = false;
		for (const [keyword, cat] of Object.entries(categoryMap)) {
			if (idLower.includes(keyword)) {
				skillScores[cat].total += 100;
				if (course.status === "completed") {
					skillScores[cat].earned += 100;
				} else if (course.progress && course.progress.totalLessons > 0) {
					skillScores[cat].earned += Math.round(
						(course.progress.completedLessons / course.progress.totalLessons) * 100
					);
				}
				matched = true;
				break;
			}
		}
		if (!matched) {
			skillScores["Core Solana"].total += 100;
			if (course.status === "completed") {
				skillScores["Core Solana"].earned += 100;
			} else if (course.progress && course.progress.totalLessons > 0) {
				skillScores["Core Solana"].earned += Math.round(
					(course.progress.completedLessons / course.progress.totalLessons) * 100
				);
			}
		}
	}

	return Object.entries(skillScores)
		.filter(([, v]) => v.total > 0)
		.map(([label, v]) => ({
			label,
			value: Math.round((v.earned / v.total) * 100),
		}));
}
