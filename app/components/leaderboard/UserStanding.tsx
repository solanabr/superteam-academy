"use client";

import { StatCard } from "@/components/shared/StatCard";
import { UserStanding as UserStandingType } from "@/lib/constants/leaderboard";

interface UserStandingProps {
	/** The calculated standing of the current user. */
	standing: UserStandingType;
}

/**
 * UserStanding Component
 * Displays the current user's global rank, percentile, and reward eligibility status.
 */
export function UserStanding({ standing }: UserStandingProps) {
	return (
		<div className="border border-ink-primary bg-bg-surface p-4 relative">
			<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
				YOUR STANDING
			</span>

			<div className="grid grid-cols-2 gap-4 mt-3">
				<StatCard
					label="CURRENT XP"
					value={(standing.xp ?? 0).toLocaleString()}
				/>
				<StatCard
					label="GLOBAL RANK"
					value={`#${standing.globalRank.toString().padStart(2, "0")}`}
				/>
				<StatCard label="PERCENTILE" value={standing.percentile} />
				<StatCard
					label="REWARDS"
					value={standing.rewardsEligible ? "ELIGIBLE" : "LOCKED"}
				/>
			</div>
		</div>
	);
}
