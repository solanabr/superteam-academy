"use client";

import { useEffect, useRef } from "react";
import { Flame, Calendar } from "lucide-react";
import { StreakEventType } from "@superteam-academy/gamification/streak-system";
import { Progress } from "@/components/ui/progress";
import { useStreak } from "@/hooks/use-streak";

interface StreakTrackerProps {
	walletAddress?: string;
}

export function StreakTracker({ walletAddress }: StreakTrackerProps) {
	const { streakData, recordActivity } = useStreak(walletAddress);
	const recordRef = useRef(recordActivity);
	recordRef.current = recordActivity;

	useEffect(() => {
		if (!walletAddress) return;
		recordRef.current(StreakEventType.DAILY_LOGIN);
	}, [walletAddress]);

	const weeklyPct = Math.min(
		Math.round((streakData.thisWeekActivities / streakData.weeklyGoal) * 100),
		100
	);

	const daysSince = Math.floor(
		(Date.now() - new Date(streakData.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
	);
	const isActive = daysSince === 0;
	const isWarning = daysSince === 1;

	// Build current week
	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - today.getDay());

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(startOfWeek);
		d.setDate(startOfWeek.getDate() + i);
		const iso = d.toISOString().split("T")[0];
		const entry = streakData.streakHistory.find((h) => h.date === iso);
		return {
			label: d.toLocaleDateString("en", { weekday: "narrow" }),
			active: (entry?.activities ?? 0) > 0,
			isToday: d.toDateString() === today.toDateString(),
			isPast: d < today && d.toDateString() !== today.toDateString(),
		};
	});

	return (
		<div className="rounded-2xl border border-border/60 bg-card p-5 space-y-5">
			<div className="flex items-center gap-3">
				<div
					className={`w-12 h-12 rounded-xl flex items-center justify-center ${
						isActive ? "bg-destructive/10" : isWarning ? "bg-gold/10" : "bg-muted"
					}`}
				>
					<Flame
						className={`h-6 w-6 ${
							isActive
								? "text-destructive"
								: isWarning
									? "text-gold"
									: "text-muted-foreground"
						}`}
					/>
				</div>
				<div className="flex-1">
					<div className="flex items-baseline gap-1.5">
						<span className="text-2xl font-bold">{streakData.current}</span>
						<span className="text-sm text-muted-foreground">day streak</span>
					</div>
					<div className="text-xs text-muted-foreground">
						Longest: {streakData.longest} days
					</div>
				</div>
				{isWarning && (
					<span className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-1 rounded-md">
						Streak at risk
					</span>
				)}
			</div>

			<div>
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs font-medium flex items-center gap-1.5">
						<Calendar className="h-3 w-3" />
						This week
					</span>
					<span className="text-xs text-muted-foreground">
						{streakData.thisWeekActivities}/{streakData.weeklyGoal}
					</span>
				</div>

				<div className="grid grid-cols-7 gap-1.5 mb-2">
					{weekDays.map((day, i) => (
						<div key={i} className="text-center">
							<div className="text-[10px] text-muted-foreground mb-1">
								{day.label}
							</div>
							<div
								className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium ${
									day.isToday
										? "ring-2 ring-primary bg-primary text-primary-foreground"
										: day.active
											? "bg-green/20 text-green"
											: day.isPast
												? "bg-destructive/10 text-destructive/60"
												: "bg-muted text-muted-foreground"
								}`}
							>
								{day.active ? (
									<Flame className="h-3 w-3" />
								) : day.isPast ? (
									<span className="text-[9px]">--</span>
								) : null}
							</div>
						</div>
					))}
				</div>

				<Progress value={weeklyPct} className="h-1.5" />
			</div>

			<div className="pt-3 border-t border-border/40">
				<span className="text-xs text-muted-foreground block mb-2">Milestones</span>
				<div className="flex gap-2">
					{[7, 14, 30, 100].map((m) => {
						const done = streakData.longest >= m;
						return (
							<div
								key={m}
								className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
									done
										? "bg-gold/10 text-gold border border-gold/20"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{m}d
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
