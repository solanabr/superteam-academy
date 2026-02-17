"use client";

import { Trophy, Flame, Award, Zap } from "lucide-react";

interface UserRank {
	globalRank: number;
	weeklyRank: number;
	monthlyRank: number;
	score: number;
	level: number;
	achievements: number;
	streak: number;
	percentile: number;
}

interface UserRankCardProps {
	userRank: UserRank;
}

export function UserRankCard({ userRank }: UserRankCardProps) {
	return (
		<div className="rounded-2xl bg-gradient-to-br from-forest via-green to-forest p-[1px]">
			<div className="rounded-2xl bg-card p-6 h-full">
				<div className="flex flex-col md:flex-row md:items-center gap-6">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
							<Trophy className="h-7 w-7 text-gold" />
						</div>
						<div>
							<div className="text-sm text-muted-foreground">Your global rank</div>
							<div className="text-3xl font-bold">#{userRank.globalRank}</div>
							<div className="text-xs text-muted-foreground">
								Top {(100 - userRank.percentile).toFixed(0)}% of learners
							</div>
						</div>
					</div>

					<div className="hidden md:block w-px h-16 bg-border/60" />

					<div className="flex gap-6 flex-wrap">
						<div className="text-center">
							<div className="text-xl font-bold text-primary">#{userRank.weeklyRank}</div>
							<div className="text-xs text-muted-foreground">This week</div>
						</div>
						<div className="text-center">
							<div className="text-xl font-bold text-forest">#{userRank.monthlyRank}</div>
							<div className="text-xs text-muted-foreground">This month</div>
						</div>
					</div>

					<div className="md:ml-auto flex items-center gap-5">
						<div className="flex items-center gap-1.5 text-sm">
							<Zap className="h-4 w-4 text-gold" />
							<span className="font-semibold">{userRank.score.toLocaleString()}</span>
							<span className="text-muted-foreground text-xs">XP</span>
						</div>
						<div className="flex items-center gap-1.5 text-sm">
							<Flame className="h-4 w-4 text-destructive" />
							<span className="font-semibold">{userRank.streak}</span>
							<span className="text-muted-foreground text-xs">streak</span>
						</div>
						<div className="flex items-center gap-1.5 text-sm">
							<Award className="h-4 w-4 text-primary" />
							<span className="font-semibold">{userRank.achievements}</span>
							<span className="text-muted-foreground text-xs">badges</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
