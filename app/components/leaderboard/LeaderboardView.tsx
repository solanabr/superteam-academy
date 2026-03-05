/**
 * @fileoverview Client-side view component for the Leaderboard.
 * Manages filtering, active state of rankings, and responsive layout for the leaderboard.
 */

"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { NavRail } from "@/components/layout/NavRail";
import { TopBar } from "@/components/layout/TopBar";
import { FilterControls } from "@/components/leaderboard/FilterControls";
import { RankCard } from "@/components/leaderboard/RankCard";
import { SeasonalPrizes } from "@/components/leaderboard/SeasonalPrizes";
import { UserStanding } from "@/components/leaderboard/UserStanding";
import { fetchFilteredLeaderboard } from "@/lib/actions/leaderboard";
import {
	LeaderboardEntry,
	LeaderboardPeriod,
	LeaderboardTrack,
	UserStanding as UserStandingType,
} from "@/lib/constants/leaderboard";
import { useOnchainStats } from "@/lib/hooks/use-onchain-stats";
import { cn } from "@/lib/utils";

interface LeaderboardViewProps {
	/** Initial list of ranks fetched from the server. */
	initialEntries: LeaderboardEntry[];
	/** ID of the currently logged-in user for matching their entry. */
	currentUserId?: string;
	/** Position and statistics for the currently logged-in user. */
	userStanding: UserStandingType;
}

/**
 * LeaderboardView Component
 * Renders the main leaderboard UI grid with filters and ranking cards.
 */
export function LeaderboardView({
	initialEntries,
	currentUserId,
	userStanding,
}: LeaderboardViewProps) {
	const { publicKey } = useWallet();
	const onchainStats = useOnchainStats(publicKey?.toString());

	const [entries, setEntries] = useState(initialEntries);
	const [isLoading, setIsLoading] = useState(false);

	// Merge on-chain data into user standing
	const displayStanding = {
		...userStanding,
		xp: onchainStats.loading ? userStanding.xp || 0 : onchainStats.xp,
	};

	// Merge on-chain XP into current user's leaderboard entry — same as sidebar
	const displayEntries = (() => {
		if (!publicKey || onchainStats.loading) return entries;

		const updated = entries.map((entry) => {
			if (entry.userId === currentUserId) {
				return {
					...entry,
					xp: onchainStats.xp,
					level: onchainStats.level,
					isCurrentUser: true,
				};
			}
			return entry;
		});

		// Re-sort by XP and recalculate ranks
		updated.sort((a, b) => b.xp - a.xp);
		return updated.map((e, i) => ({ ...e, rank: i + 1 }));
	})();

	const handleFilterChange = async (
		period: LeaderboardPeriod,
		track: LeaderboardTrack,
	) => {
		setIsLoading(true);
		try {
			const newEntries = await fetchFilteredLeaderboard(period, track);
			setEntries(newEntries);
		} catch (error) {
			console.error("Failed to fetch leaderboard:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-bg-base">
			{/* App Shell Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-[60px_1fr_350px] lg:grid-rows-[48px_1fr] min-h-screen lg:h-screen lg:overflow-hidden max-w-full">
				{/* Top Bar - spans all columns */}
				<div className="col-span-1 lg:col-span-3">
					<TopBar />
				</div>

				{/* Nav Rail */}
				<NavRail />

				{/* Main Stage */}
				<section className="p-4 lg:p-8 overflow-visible lg:overflow-y-auto flex flex-col">
					{/* Section Header */}
					<div className="flex justify-between items-end mb-6 border-b border-border pb-2">
						<div>
							<span className="bg-ink-primary text-bg-base px-2 py-1 text-[10px] uppercase tracking-widest inline-block mb-2">
								Global Ranking
							</span>
							<h2 className="font-display text-2xl lg:text-[32px] leading-none -tracking-wider">
								OPERATOR LEADERBOARD
							</h2>
						</div>
						<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
							Updated: 1m ago
						</div>
					</div>

					{/* Filter Controls */}
					<FilterControls onFilterChange={handleFilterChange} />

					{/* Ranking Table */}
					<div
						className={cn(
							"flex flex-col gap-2 transition-opacity",
							isLoading && "opacity-50 pointer-events-none",
						)}
					>
						{displayEntries.length > 0 ? (
							displayEntries.map((entry) => (
								<RankCard
									key={entry.userId}
									entry={entry}
									showCrosshair={entry.rank <= 2}
								/>
							))
						) : (
							<div className="text-center py-20 border border-dashed border-border">
								<span className="text-xs uppercase tracking-widest text-ink-secondary">
									No records found for this period/track
								</span>
							</div>
						)}
					</div>

					{/* Load More */}
					<div className="text-center mt-4 text-[10px] uppercase tracking-widest text-ink-secondary">
						-- [ VIEW NEXT 50 OPERATORS ] --
					</div>
				</section>

				{/* Context Panel (Right Sidebar) */}
				<aside className="border-t lg:border-t-0 lg:border-l border-border bg-bg-base p-6 flex flex-col gap-8 overflow-visible lg:overflow-y-auto">
					<UserStanding standing={displayStanding} />

					<SeasonalPrizes />

					{/* Activity Feed */}
					<div className="mt-auto border border-ink-secondary p-4 bg-ink-primary/5">
						<div className="text-[10px] uppercase tracking-widest font-bold mb-3">
							Activity Feed
						</div>
						<div className="flex flex-col gap-2">
							<div className="text-[10px]">
								<span className="text-ink-secondary">14:02</span> {"//"}{" "}
								0xFE2... gained +500 XP
							</div>
							<div className="text-[10px]">
								<span className="text-ink-secondary">13:45</span> {"//"} YOU
								completed &apos;PDA&apos; module
							</div>
							<div className="text-[10px]">
								<span className="text-ink-secondary">12:10</span> {"//"}{" "}
								LAMPORT_GOD reached Level 7
							</div>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
}
