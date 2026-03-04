"use client";

import { Clock, BookOpen, Target, Flame } from "lucide-react";
import { useStreak } from "@/hooks/use-streak";
import { formatDuration } from "@/lib/utils";

interface ProgressStatsProps {
	walletAddress?: string | undefined;
	stats: {
		level: number;
		xp: number;
		totalXP: number;
		nextLevelXP: number;
		streak: {
			current: number;
			longest: number;
		};
		courses: {
			completed: number;
			enrolled: number;
			inProgress: number;
		};
		lessons: {
			completed: number;
			total: number;
		};
		timeSpent: {
			today: number;
			thisWeek: number;
			total: number;
		};
	};
}

const STAT_ITEMS = [
	{ key: "streak", label: "Streak", Icon: Flame, color: "text-destructive bg-destructive/10" },
	{ key: "courses", label: "Courses", Icon: BookOpen, color: "text-green bg-green/10" },
	{ key: "lessons", label: "Lessons", Icon: Target, color: "text-primary bg-primary/10" },
] as const;

export function ProgressStats({ stats, walletAddress }: ProgressStatsProps) {
	const { streakData } = useStreak(walletAddress);
	const streakCurrent = streakData.current || stats.streak.current;
	const streakLongest = streakData.longest || stats.streak.longest;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-3">
				{STAT_ITEMS.map(({ key, label, Icon, color }) => {
					const value =
						key === "streak"
							? streakCurrent
							: key === "courses"
								? stats.courses.completed
								: stats.lessons.completed;
					const sub =
						key === "streak"
							? `Best: ${streakLongest}`
							: key === "courses"
								? `${stats.courses.inProgress} active`
								: `of ${stats.lessons.total}`;

					return (
						<div key={key} className="rounded-xl border border-border/60 bg-card p-4">
							<div
								className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}
							>
								<Icon className="h-4 w-4" />
							</div>
							<div className="text-xl font-bold">{value}</div>
							<div className="text-xs text-muted-foreground">{label}</div>
							<div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>
						</div>
					);
				})}
			</div>

			<div className="rounded-2xl border border-border/60 bg-card px-5 py-4">
				<div className="flex items-center gap-2 mb-3">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">Time Spent</span>
				</div>
				<div className="grid grid-cols-3 gap-3">
					{[
						{ label: "Today", val: stats.timeSpent.today },
						{ label: "This week", val: stats.timeSpent.thisWeek },
						{ label: "All time", val: stats.timeSpent.total },
					].map((t) => (
						<div key={t.label} className="text-center">
							<div className="text-lg font-bold">{formatDuration(t.val)}</div>
							<div className="text-[10px] text-muted-foreground">{t.label}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
