/**
 * @fileoverview ActivityFeed component.
 * Displays a chronological list of user activities (lessons, achievements, etc.).
 */

"use client";

import { type ActivityItem } from "@/lib/data/activity";

interface ActivityFeedProps {
	activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return (
			date
				.toLocaleDateString("en-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				})
				.replace(/\//g, ".") +
			" // " +
			date.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		);
	};

	return (
		<div className="flex flex-col gap-3">
			{activities.map((activity) => (
				<div
					key={activity.id}
					className="pl-3 border-l border-ink-primary pb-3 relative"
				>
					{/* Timeline dot */}
					<div className="absolute -left-[3.5px] top-0 w-[7px] h-[7px] bg-ink-primary"></div>

					<div className="text-[10px] uppercase tracking-widest text-ink-secondary">
						{formatDate(activity.timestamp)}
					</div>
					<div className="font-bold text-sm">{activity.title}</div>
					{activity.description && (
						<div className="text-[10px] uppercase tracking-widest text-ink-secondary mt-0.5">
							{activity.description}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
