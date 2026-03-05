"use client";

import { CustomAvatar } from "@/components/shared/CustomAvatar";
import { Link } from "@/i18n/routing";
import { LeaderboardEntry } from "@/lib/constants/leaderboard";

interface RankCardProps {
	/** Data for the individual leaderboard entry. */
	entry: LeaderboardEntry;
	/** Whether to show stylized crosshair decorations for top positions. */
	showCrosshair?: boolean;
}

/**
 * RankCard Component
 * Displays ranking position, user avatar, and XP stats in a horizontal list item format.
 */
export function RankCard({ entry, showCrosshair = false }: RankCardProps) {
	return (
		<Link
			href={`/profile/${entry.userId}`}
			className={`grid grid-cols-[40px_40px_1fr_auto] md:grid-cols-[60px_50px_1fr_120px_80px_100px] items-center px-4 md:px-6 py-3 border relative transition-all block ${
				entry.isCurrentUser
					? "bg-ink-primary text-bg-base border-ink-primary"
					: "border-border bg-bg-surface hover:border-ink-primary hover:shadow-[4px_4px_0_rgba(13,20,18,0.1)] dark:hover:shadow-[4px_4px_0_rgba(255,255,255,0.1)]"
			}`}
		>
			{/* Crosshair decoration for top ranks */}
			{showCrosshair && entry.rank === 1 && (
				<div className="absolute -top-1 -left-1 w-2.5 h-2.5">
					<div className="absolute w-full h-px bg-ink-secondary top-1/2"></div>
					<div className="absolute h-full w-px bg-ink-secondary left-1/2"></div>
				</div>
			)}
			{showCrosshair && entry.rank === 2 && entry.isCurrentUser && (
				<div className="absolute -top-1 -right-1 w-2.5 h-2.5">
					<div className="absolute w-full h-px bg-bg-base top-1/2"></div>
					<div className="absolute h-full w-px bg-bg-base left-1/2"></div>
				</div>
			)}

			{/* Rank Number */}
			<div className="font-display text-xl md:text-2xl font-bold">
				{entry.rank.toString().padStart(2, "0")}
			</div>

			{/* Avatar */}
			<div className="flex items-center justify-center">
				<div
					className={`flex items-center justify-center border p-0.5 shadow-sm transition-colors ${
						entry.isCurrentUser
							? "border-bg-base/60 bg-bg-base/20"
							: "border-ink-secondary/40 bg-bg-base/10"
					}`}
				>
					<CustomAvatar
						seed={entry.avatar || entry.userId}
						size="sm"
						className="md:scale-110"
					/>
				</div>
			</div>

			{/* Username */}
			<div className="font-bold pl-3 truncate">{entry.username}</div>

			{/* XP */}
			<div className="font-display text-lg md:text-xl text-right pr-0 md:pr-6">
				{entry.xp.toLocaleString()}{" "}
				<span
					className={`text-[10px] ${entry.isCurrentUser ? "opacity-40" : "text-ink-secondary"}`}
				>
					XP
				</span>
			</div>

			{/* Level Badge (Desktop Only) */}
			<div className="hidden md:block">
				<span className="text-[10px] border border-current px-1.5 py-0.5 inline-block uppercase tracking-widest">
					LVL {entry.level}
				</span>
			</div>

			{/* Streak (Desktop Only) */}
			<div className="text-right text-[10px] font-medium hidden md:block">
				{entry.streak}
				<span
					className={entry.isCurrentUser ? "opacity-60" : "text-ink-secondary"}
				>
					D STREAK
				</span>
			</div>
		</Link>
	);
}
