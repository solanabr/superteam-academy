/**
 * @fileoverview StreakCalendar component for the dashboard.
 * Visualizes the user's daily activity streak in a compact 14-day grid.
 */

"use client";

import { useTranslations } from "next-intl";
import { type StreakDay } from "@/lib/data/user";

interface StreakCalendarProps {
	streak: {
		current: number;
		calendar: StreakDay[];
	};
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
	const t = useTranslations("Dashboard.streak");
	// Ensure we only show 14 days (2 rows of 7)
	const displayDays = streak.calendar.slice(-14);

	return (
		<div className="border border-border p-4 bg-bg-surface relative group">
			<div className="flex justify-between items-baseline mb-4">
				<span className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary/60">
					{t("title")}
				</span>
				<span className="font-display text-2xl tracking-tighter text-ink-primary">
					{streak.current}
					{t("days")}
				</span>
			</div>

			<div className="grid grid-cols-7 gap-1.5">
				{displayDays.map((day, index) => {
					const date = new Date(day.date);
					const dayNumber = date.getDate();
					const isToday = day.date === new Date().toISOString().split("T")[0];

					return (
						<div
							key={index}
							className={`aspect-square border flex items-center justify-center text-[10px] font-medium transition-all duration-300 ${
								day.active
									? "bg-ink-primary text-bg-base border-ink-primary"
									: "border-ink-secondary/20 text-ink-secondary/40 hover:border-ink-secondary/40"
							} ${isToday && !day.active ? "border-ink-primary/50 text-ink-primary/60" : ""}`}
						>
							{dayNumber}
						</div>
					);
				})}
			</div>

			{/* Grid decoration */}
			<div className="absolute top-0 right-0 w-4 h-4 overflow-hidden pointer-events-none opacity-20">
				<div className="absolute top-0 right-0 w-px h-full bg-ink-primary"></div>
				<div className="absolute top-0 right-0 w-full h-px bg-ink-primary"></div>
			</div>
		</div>
	);
}
