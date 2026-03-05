"use client";

import { CalendarBlankIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { mockEvents } from "@/lib/data/community";

export function CommunitySidebar() {
	return (
		<aside className="border-t lg:border-t-0 lg:border-l border-ink-secondary/20 dark:border-border bg-bg-base p-6 flex flex-col gap-8 overflow-visible lg:overflow-y-auto">
			{/* Events Radar */}
			<section>
				<div className="flex items-center gap-2 mb-4">
					<CalendarBlankIcon
						weight="duotone"
						className="w-5 h-5 text-ink-primary"
					/>
					<h2 className="font-bold uppercase tracking-widest text-[13px]">
						Events Radar
					</h2>
				</div>

				<div className="space-y-4">
					{mockEvents.map((event) => (
						<div
							key={event.id}
							className="border border-ink-secondary/20 dark:border-border bg-surface/50 p-4 border-l-2 border-l-ink-primary relative group hover:bg-ink-primary/5 transition-colors"
						>
							<div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-ink-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

							<div className="flex justify-between items-start mb-2">
								<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
									{event.type}
								</span>
								<span className="text-[10px] font-bold border border-ink-secondary/30 px-1 font-mono">
									{event.attendees}
								</span>
							</div>
							<h3 className="font-bold mb-1 leading-tight group-hover:text-ink-primary transition-colors">
								{event.title}
							</h3>
							<div className="text-xs text-ink-secondary mb-3 uppercase tracking-widest">
								{event.date} • {event.location}
							</div>
							<Button
								variant="outline"
								className="w-full uppercase text-[10px] h-7 rounded-none tracking-widest border-ink-primary/50 text-ink-primary hover:bg-ink-primary hover:text-bg-base transition-colors"
							>
								RSVP
							</Button>
						</div>
					))}
				</div>
			</section>
		</aside>
	);
}
