/**
 * @fileoverview StreakGraph component for the profile page.
 * Renders a "GitHub-style" contribution graph showing historical activity streaks.
 */

"use client";

import { useMemo, useState } from "react";
import { type StreakDay } from "@/lib/data/user";

interface StreakGraphProps {
	history: StreakDay[];
}

export function StreakGraph({ history }: StreakGraphProps) {
	const [filter, setFilter] = useState<"3M" | "6M" | "1Y" | "ALL">("3M");

	const filteredHistory = useMemo(() => {
		let daysToKeep = 90;
		if (filter === "6M") daysToKeep = 180;
		if (filter === "1Y") daysToKeep = 365;
		if (filter === "ALL") return history;

		return history.slice(-daysToKeep);
	}, [history, filter]);

	const monthLabels = useMemo(() => {
		const labels: { month: string; colIndex: number }[] = [];
		let currentMonth = "";

		filteredHistory.forEach((day, index) => {
			const date = new Date(day.date);
			const month = date
				.toLocaleString("en-US", { month: "short" })
				.toUpperCase();
			const colIndex = Math.floor(index / 7);

			if (month !== currentMonth) {
				currentMonth = month;
				// Ensure labels are spaced out so they don't overlap
				if (
					labels.length === 0 ||
					colIndex - labels[labels.length - 1].colIndex >= 3
				) {
					labels.push({ month, colIndex });
				}
			}
		});
		return labels;
	}, [filteredHistory]);

	const totalCols = Math.ceil(filteredHistory.length / 7);

	return (
		<div className="border border-border p-6 bg-bg-surface relative overflow-hidden shrink-0 w-full">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
				<div>
					<span className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary/60 block mb-1">
						CONTRIBUTION_LEVEL
					</span>
					<h2 className="font-display text-2xl tracking-tighter text-ink-primary uppercase">
						OPERATIONAL_STREAK
					</h2>
				</div>

				<div className="flex bg-ink-primary/5 p-1 border border-ink-secondary/10">
					{(["3M", "6M", "1Y", "ALL"] as const).map((f) => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-all ${
								filter === f
									? "bg-ink-primary text-bg-base"
									: "text-ink-secondary hover:text-ink-primary"
							}`}
						>
							{f}
						</button>
					))}
				</div>
			</div>

			<div className="overflow-x-auto pb-4 custom-scrollbar min-h-[160px] flex items-center">
				<div className="flex gap-3 min-w-max">
					{/* Day Labels */}
					<div className="flex flex-col text-[10px] uppercase font-mono tracking-widest text-ink-secondary/60 font-bold mt-[26px]">
						<span className="h-[14px]">MON</span>
						<span className="h-[14px] mt-[6px]">TUE</span>
						<span className="h-[14px] mt-[6px]">WED</span>
						<span className="h-[14px] mt-[6px]">THU</span>
						<span className="h-[14px] mt-[6px]">FRI</span>
						<span className="h-[14px] mt-[6px]">SAT</span>
						<span className="h-[14px] mt-[6px]">SUN</span>
					</div>

					<div className="flex flex-col gap-2">
						{/* Month Labels */}
						<div
							className="grid gap-1.5 text-[10px] uppercase font-mono tracking-widest text-ink-secondary/60 font-bold mb-1"
							style={{ gridTemplateColumns: `repeat(${totalCols}, 14px)` }}
						>
							{monthLabels.map((label, i) => (
								<div
									key={i}
									style={{ gridColumn: label.colIndex + 1 }}
									className="whitespace-nowrap -ml-0.5"
								>
									{label.month}
								</div>
							))}
						</div>

						{/* Streak Grid */}
						<div className="grid grid-flow-col grid-rows-7 gap-1.5">
							{filteredHistory.map((day, index) => (
								<div
									key={index}
									className={`w-3.5 h-3.5 aspect-square border transition-all duration-300 ${
										day.active
											? "bg-ink-primary border-ink-primary shadow-[0_0_8px_rgba(var(--ink-primary-rgb),0.3)]"
											: "border-ink-secondary/20 bg-ink-secondary/5 hover:border-ink-secondary/40"
									}`}
									title={`${day.date}: ${day.active ? "ACTIVE" : "INACTIVE"}`}
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-6 flex justify-between items-center text-[10px] uppercase tracking-widest text-ink-secondary/40 font-bold font-mono">
				<div className="flex items-center gap-4">
					<span>{filteredHistory[0]?.date.replace(/-/g, ".")}</span>
					<span>{">>"}</span>
					<span>
						{filteredHistory[filteredHistory.length - 1]?.date.replace(
							/-/g,
							".",
						)}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<span>LESS</span>
					<div className="flex gap-1">
						<div className="w-2.5 h-2.5 border border-ink-secondary/10" />
						<div className="w-2.5 h-2.5 bg-ink-primary/30 border border-ink-primary/30" />
						<div className="w-2.5 h-2.5 bg-ink-primary border border-ink-primary" />
					</div>
					<span>MORE</span>
				</div>
			</div>

			{/* Decorative pulse at bottom */}
			<div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-ink-primary/20 to-transparent"></div>
		</div>
	);
}
