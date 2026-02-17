"use client";

import { TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LevelProgressProps {
	currentLevel: number;
	currentXP: number;
	nextLevelXP: number;
	totalXP: number;
	levelUpHistory?: Array<{
		level: number;
		achievedAt: string;
		xpAtLevel: number;
	}>;
}

export function LevelProgress({
	currentLevel,
	currentXP: _currentXP,
	nextLevelXP,
	totalXP,
	levelUpHistory = [],
}: LevelProgressProps) {
	const lastLevelXP =
		levelUpHistory.length > 0 ? levelUpHistory[levelUpHistory.length - 1].xpAtLevel : 0;
	const xpInLevel = totalXP - lastLevelXP;
	const progress = Math.min((xpInLevel / nextLevelXP) * 100, 100);
	const xpRemaining = Math.max(nextLevelXP - xpInLevel, 0);

	return (
		<div className="rounded-2xl border border-border/60 bg-card p-5">
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-semibold flex items-center gap-2">
					<TrendingUp className="h-4 w-4 text-primary" />
					Level Progress
				</h3>
				<span className="text-xs text-muted-foreground">
					{totalXP.toLocaleString()} XP total
				</span>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green to-forest text-white text-sm font-bold shrink-0">
					{currentLevel}
				</div>
				<div className="flex-1 space-y-1.5">
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>
							{xpInLevel.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
						</span>
						<span>
							{xpRemaining > 0
								? `${xpRemaining.toLocaleString()} to go`
								: "Ready to level up"}
						</span>
					</div>
					<Progress value={progress} className="h-2.5" />
				</div>
				<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-muted-foreground text-sm font-bold shrink-0">
					{currentLevel + 1}
				</div>
			</div>

			{levelUpHistory.length > 0 && (
				<div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/40">
					<span className="text-xs text-muted-foreground">Recent:</span>
					{levelUpHistory
						.slice(-3)
						.reverse()
						.map((lv, i) => (
							<span
								key={i}
								className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted"
							>
								Lvl {lv.level}
								<span className="text-muted-foreground">
									{new Date(lv.achievedAt).toLocaleDateString("en", {
										month: "short",
										day: "numeric",
									})}
								</span>
							</span>
						))}
				</div>
			)}
		</div>
	);
}
