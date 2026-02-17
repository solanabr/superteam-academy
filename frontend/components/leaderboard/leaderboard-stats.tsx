"use client";

import { Users, Activity, Zap, Target } from "lucide-react";

interface LeaderboardStatsProps {
	stats: {
		totalUsers: number;
		activeThisWeek: number;
		totalXP: number;
		averageLevel: number;
	};
}

export function LeaderboardStats({ stats }: LeaderboardStatsProps) {
	const items = [
		{ icon: Users, label: "Total learners", value: stats.totalUsers.toLocaleString(), color: "text-primary" },
		{ icon: Activity, label: "Active this week", value: stats.activeThisWeek.toLocaleString(), color: "text-green" },
		{ icon: Zap, label: "Total XP earned", value: stats.totalXP.toLocaleString(), color: "text-gold" },
		{ icon: Target, label: "Avg. level", value: stats.averageLevel.toFixed(1), color: "text-forest" },
	];

	return (
		<div className="rounded-2xl bg-card border border-border/60 p-5 h-full flex flex-col justify-between gap-4">
			{items.map((stat) => (
				<div key={stat.label} className="flex items-center gap-3">
					<div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
						<stat.icon className="h-4 w-4" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="text-xs text-muted-foreground">{stat.label}</div>
						<div className="text-lg font-bold leading-tight">{stat.value}</div>
					</div>
				</div>
			))}
		</div>
	);
}
