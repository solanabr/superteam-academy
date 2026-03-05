/**
 * @fileoverview Filter controls for the leaderboard.
 * Allows users to filter by time period and on-chain track collection.
 */

"use client";

import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	LeaderboardPeriod,
	LeaderboardTrack,
	TRACK_COLLECTIONS,
} from "@/lib/constants/leaderboard";

interface FilterControlsProps {
	/** Callback triggered when any filter value changes. */
	onFilterChange: (period: LeaderboardPeriod, track: LeaderboardTrack) => void;
}

/**
 * Available tracks mapped to their on-chain collection addresses.
 */
const trackOptions = [
	{ value: "all", label: "FILTER: ALL TRACKS" },
	{ value: TRACK_COLLECTIONS[1], label: "RUST FUNDAMENTALS" },
	{ value: TRACK_COLLECTIONS[2], label: "ANCHOR FRAMEWORK" },
	{ value: TRACK_COLLECTIONS[3], label: "DEFI PROTOCOLS" },
	{ value: TRACK_COLLECTIONS[4], label: "SECURITY & AUDITING" },
	{ value: TRACK_COLLECTIONS[5], label: "FRONTEND DEVELOPMENT" },
];

/**
 * FilterControls Component
 * Renders tabs for time periods and a dropdown for track collection filtering.
 */
export function FilterControls({ onFilterChange }: FilterControlsProps) {
	const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>("weekly");
	const [activeTrack, setActiveTrack] = useState<LeaderboardTrack>("all");

	const handlePeriodChange = (period: LeaderboardPeriod) => {
		setActivePeriod(period);
		onFilterChange(period, activeTrack);
	};

	const handleTrackChange = (track: string) => {
		const newTrack = track as LeaderboardTrack;
		setActiveTrack(newTrack);
		onFilterChange(activePeriod, newTrack);
	};

	return (
		<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-8 items-start lg:items-center">
			{/* Period Tab Group */}
			<div className="flex border border-ink-secondary w-full lg:w-auto overflow-x-auto">
				<button
					onClick={() => handlePeriodChange("weekly")}
					className={`flex-1 lg:flex-none px-4 py-2 text-[11px] uppercase tracking-widest border-r border-ink-secondary ${
						activePeriod === "weekly"
							? "bg-ink-primary text-bg-base"
							: "bg-transparent text-ink-secondary hover:bg-ink-primary/5"
					}`}
				>
					Weekly
				</button>
				<button
					onClick={() => handlePeriodChange("monthly")}
					className={`flex-1 lg:flex-none px-4 py-2 text-[11px] uppercase tracking-widest border-r border-ink-secondary ${
						activePeriod === "monthly"
							? "bg-ink-primary text-bg-base"
							: "bg-transparent text-ink-secondary hover:bg-ink-primary/5"
					}`}
				>
					Monthly
				</button>
				<button
					onClick={() => handlePeriodChange("all-time")}
					className={`flex-1 lg:flex-none px-4 py-2 text-[11px] uppercase tracking-widest ${
						activePeriod === "all-time"
							? "bg-ink-primary text-bg-base"
							: "bg-transparent text-ink-secondary hover:bg-ink-primary/5"
					}`}
				>
					All-Time
				</button>
			</div>

			{/* Track Filter Dropdown */}
			<div className="w-full lg:w-auto">
				<Select value={activeTrack} onValueChange={handleTrackChange}>
					<SelectTrigger className="w-full lg:w-[200px] h-auto py-2 px-3 text-[11px] uppercase tracking-widest border-ink-secondary bg-transparent">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{trackOptions.map((option) => (
							<SelectItem
								key={option.value}
								value={option.value}
								className="text-[11px] uppercase tracking-widest"
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Cycle Info */}
			<div className="text-[10px] uppercase tracking-widest text-ink-secondary ml-0 lg:ml-auto w-full lg:w-auto text-right">
				Cycle 42 {"//"} Stage 3
			</div>
		</div>
	);
}
