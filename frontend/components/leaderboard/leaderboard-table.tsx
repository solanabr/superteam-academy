"use client";

import {
	Trophy,
	TrendingUp,
	TrendingDown,
	Minus,
	ChevronLeft,
	ChevronRight,
	Flame,
	Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LeaderboardEntry {
	rank: number;
	user: {
		id: string;
		name: string;
		avatar?: string;
		country: string;
	};
	score: number;
	level: number;
	achievements: number;
	streak: number;
	change: number;
}

interface LeaderboardTableProps {
	title: string;
	description: string;
	entries: LeaderboardEntry[];
	showPagination?: boolean;
	compact?: boolean;
}

const RANK_STYLES: Record<number, string> = {
	1: "bg-gradient-to-r from-gold/20 to-gold/5 border-gold/30",
	2: "bg-gradient-to-r from-muted to-muted/50 border-muted-foreground/20",
	3: "bg-gradient-to-r from-amber-100/50 to-amber-50/30 dark:from-amber-900/20 dark:to-amber-800/10 border-amber-300/30",
};

export function LeaderboardTable({
	title,
	description,
	entries,
	showPagination = true,
	compact = false,
}: LeaderboardTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = compact ? 5 : 10;
	const totalPages = Math.ceil(entries.length / itemsPerPage);
	const start = (currentPage - 1) * itemsPerPage;
	const currentEntries = entries.slice(start, start + itemsPerPage);

	return (
		<div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
			<div className="px-5 py-4 border-b border-border/60">
				<h3 className="font-semibold">{title}</h3>
				<p className="text-xs text-muted-foreground mt-0.5">{description}</p>
			</div>

			<div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2.5 text-xs font-medium text-muted-foreground border-b border-border/40 bg-muted/30">
				<div className="col-span-1">Rank</div>
				<div className="col-span-4">Learner</div>
				<div className="col-span-2 text-right">XP</div>
				<div className="col-span-1 text-center">Lvl</div>
				{!compact && <div className="col-span-1 text-center">Badges</div>}
				<div className="col-span-1 text-center">Streak</div>
				<div className={`${compact ? "col-span-3" : "col-span-2"} text-right`}>Change</div>
			</div>

			<div>
				{currentEntries.map((entry) => {
					const rankStyle = RANK_STYLES[entry.rank] ?? "";
					return (
						<div
							key={entry.user.id}
							className={`grid grid-cols-12 gap-3 px-5 py-3 items-center border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors ${rankStyle}`}
						>
							<div className="col-span-1 flex items-center">
								{entry.rank <= 3 ? (
									<div
										className={`w-7 h-7 rounded-lg flex items-center justify-center ${
											entry.rank === 1
												? "bg-gold/20 text-gold"
												: entry.rank === 2
													? "bg-muted text-muted-foreground"
													: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
										}`}
									>
										<Trophy className="h-3.5 w-3.5" />
									</div>
								) : (
									<span className="text-sm font-medium text-muted-foreground pl-1.5">
										{entry.rank}
									</span>
								)}
							</div>

							<div className="col-span-4 flex items-center gap-2.5">
								<Avatar className="h-8 w-8">
									<AvatarImage src={entry.user.avatar} alt={entry.user.name} />
									<AvatarFallback className="text-xs">
										{entry.user.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<div className="text-sm font-medium truncate">
										{entry.user.name}
									</div>
									<div className="text-[10px] text-muted-foreground">
										{entry.user.country}
									</div>
								</div>
							</div>

							<div className="col-span-2 text-right">
								<div className="flex items-center justify-end gap-1">
									<Zap className="h-3 w-3 text-gold" />
									<span className="text-sm font-semibold">
										{entry.score.toLocaleString()}
									</span>
								</div>
							</div>

							<div className="col-span-1 text-center">
								<span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
									{entry.level}
								</span>
							</div>

							{!compact && (
								<div className="col-span-1 text-center text-sm text-muted-foreground">
									{entry.achievements}
								</div>
							)}

							<div className="col-span-1 text-center">
								<span className="inline-flex items-center gap-0.5 text-sm">
									<Flame className="h-3 w-3 text-destructive" />
									{entry.streak}
								</span>
							</div>

							<div
								className={`${compact ? "col-span-3" : "col-span-2"} flex items-center justify-end gap-1`}
							>
								{entry.change > 0 ? (
									<>
										<TrendingUp className="h-3.5 w-3.5 text-green" />
										<span className="text-xs font-medium text-green">
											+{entry.change}
										</span>
									</>
								) : entry.change < 0 ? (
									<>
										<TrendingDown className="h-3.5 w-3.5 text-destructive" />
										<span className="text-xs font-medium text-destructive">
											{entry.change}
										</span>
									</>
								) : (
									<>
										<Minus className="h-3.5 w-3.5 text-muted-foreground" />
										<span className="text-xs text-muted-foreground">--</span>
									</>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{showPagination && totalPages > 1 && (
				<div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/20">
					<span className="text-xs text-muted-foreground">
						{start + 1}-{Math.min(start + itemsPerPage, entries.length)} of{" "}
						{entries.length}
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-7 w-7 p-0"
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="h-3.5 w-3.5" />
						</Button>
						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
							(page) => (
								<Button
									key={page}
									variant={currentPage === page ? "default" : "ghost"}
									size="sm"
									className="h-7 w-7 p-0 text-xs"
									onClick={() => setCurrentPage(page)}
								>
									{page}
								</Button>
							)
						)}
						<Button
							variant="ghost"
							size="sm"
							className="h-7 w-7 p-0"
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
						>
							<ChevronRight className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
