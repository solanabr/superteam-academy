"use client";

import { Progress } from "@/components/ui/progress";
import { Certificate } from "@/lib/data/certificates";

interface CourseMasteryProps {
	mastery: Certificate["mastery"];
}

export function CourseMastery({ mastery }: CourseMasteryProps) {
	const percentage = (mastery.finalScore / mastery.maxScore) * 100;

	return (
		<div className="relative p-6 bg-zinc-50 dark:bg-zinc-900/40 group border border-border/50">
			{/* Corner Accents */}
			<div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-ink-primary z-20" />
			<div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-ink-primary z-20" />
			<div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-ink-primary z-20" />
			<div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-ink-primary z-20" />

			{/* Internal Dot Grid */}
			<div
				className="absolute inset-0 opacity-[0.05] pointer-events-none"
				style={{
					backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
					backgroundSize: "24px 24px",
				}}
			/>

			<div className="absolute -top-2 left-6 bg-zinc-950 dark:bg-white px-1.5 z-30">
				<span className="text-[10px] uppercase tracking-[0.2em] font-black text-white dark:text-zinc-950 leading-none">
					COURSE MASTERY
				</span>
			</div>

			<div className="flex flex-col gap-6 relative z-10 mt-2">
				<div>
					<div className="flex justify-between items-center mb-2">
						<span className="text-[9px] text-zinc-500 tracking-widest uppercase font-bold">
							Final Assessment
						</span>
						<span className="text-[11px] font-black tracking-widest font-mono">
							{mastery.finalScore}/{mastery.maxScore}
						</span>
					</div>
					<Progress value={percentage} className="h-1.5" />
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 border border-border/50 relative overflow-hidden group/stat">
						<span className="text-[8px] text-zinc-500 tracking-[0.2em] uppercase font-bold block mb-1">
							XP EARNED
						</span>
						<span className="text-sm font-black tracking-tighter font-mono">
							+{mastery.xpEarned.toLocaleString()}
						</span>
					</div>
					<div className="bg-zinc-100 dark:bg-zinc-900/60 p-4 border border-border/50 relative overflow-hidden group/stat">
						<span className="text-[8px] text-zinc-500 tracking-[0.2em] uppercase font-bold block mb-1">
							RANK UP
						</span>
						<span className="text-sm font-black tracking-tighter uppercase font-mono">
							LVL {mastery.rankAchieved}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
