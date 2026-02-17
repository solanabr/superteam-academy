"use client";

import { Trophy, Target, Flame, BookOpen, Award, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	category: "learning" | "streak" | "completion" | "social" | "special";
	rarity: "common" | "rare" | "epic" | "legendary";
	xpReward: number;
	unlockedAt?: string;
	progress?: {
		current: number;
		total: number;
	};
}

interface AchievementGridProps {
	achievements: Achievement[];
	unlockedCount: number;
	totalCount: number;
}

const ICONS: Record<string, typeof Trophy> = {
	trophy: Trophy,
	target: Target,
	flame: Flame,
	book: BookOpen,
	award: Award,
	zap: Zap,
};

const RARITY_STYLES: Record<string, string> = {
	common: "border-border/60 bg-muted/30",
	rare: "border-primary/30 bg-primary/5",
	epic: "border-green/30 bg-green/5",
	legendary: "border-gold/40 bg-gold/5",
};

const RARITY_ICON: Record<string, string> = {
	common: "text-muted-foreground",
	rare: "text-primary",
	epic: "text-green",
	legendary: "text-gold",
};

export function AchievementGrid({ achievements, unlockedCount, totalCount }: AchievementGridProps) {
	const unlocked = achievements.filter((a) => a.unlockedAt);
	const locked = achievements.filter((a) => !a.unlockedAt);
	const pct = Math.round((unlockedCount / totalCount) * 100);

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold flex items-center gap-2">
						<Trophy className="h-4 w-4 text-gold" />
						Achievements
					</h3>
					<span className="text-xs text-muted-foreground">
						{unlockedCount}/{totalCount} ({pct}%)
					</span>
				</div>
				<Progress value={pct} className="h-1.5 mt-2" />
			</div>

			<div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
				{unlocked.map((a) => {
					const Icon = ICONS[a.icon] ?? Trophy;
					return (
						<div
							key={a.id}
							className={`rounded-xl border p-3 ${RARITY_STYLES[a.rarity]} transition-colors hover:shadow-sm`}
						>
							<Icon className={`h-5 w-5 mb-2 ${RARITY_ICON[a.rarity]}`} />
							<div className="text-sm font-medium leading-tight">{a.title}</div>
							<div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
								{a.description}
							</div>
							<div className="flex items-center gap-2 mt-2">
								<span className="text-[10px] font-medium text-gold">
									+{a.xpReward} XP
								</span>
								<span className="text-[10px] text-muted-foreground capitalize">
									{a.rarity}
								</span>
							</div>
						</div>
					);
				})}

				{locked.map((a) => {
					const Icon = ICONS[a.icon] ?? Trophy;
					return (
						<div
							key={a.id}
							className="rounded-xl border border-border/40 p-3 opacity-40"
						>
							<Icon className="h-5 w-5 mb-2 text-muted-foreground" />
							<div className="text-sm font-medium leading-tight">{a.title}</div>
							<div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
								{a.description}
							</div>
							{a.progress && (
								<div className="mt-2">
									<Progress
										value={(a.progress.current / a.progress.total) * 100}
										className="h-1"
									/>
									<span className="text-[10px] text-muted-foreground mt-0.5 block">
										{a.progress.current}/{a.progress.total}
									</span>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
