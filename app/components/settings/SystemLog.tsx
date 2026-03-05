/**
 * @fileoverview Component for displaying system activity logs.
 */
"use client";

import { SystemLogEntry } from "@/lib/data/settings";

interface SystemLogProps {
	entries: SystemLogEntry[];
}

export function SystemLog({ entries }: SystemLogProps) {
	return (
		<div className="mt-auto border border-ink-secondary p-4 bg-ink-primary/5">
			<div className="text-[10px] uppercase tracking-widest font-bold mb-3">
				System Log
			</div>
			<div className="flex flex-col gap-2">
				{entries.map((entry, index) => (
					<div
						key={index}
						className={`text-[10px] ${entry.type === "error" ? "text-[#A44A3F]" : ""}`}
					>
						<span className="text-ink-secondary">{entry.timestamp}</span> {"//"}{" "}
						{entry.message}
					</div>
				))}
			</div>
		</div>
	);
}
