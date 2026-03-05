/**
 * @fileoverview BadgeShowcase component for the profile page.
 * Displays earned achievements and locked milestones as collectible badges.
 */

"use client";

import {
	BugIcon,
	CalendarCheckIcon,
	CalendarIcon,
	ChatCircleIcon,
	CpuIcon,
	FireIcon,
	FootprintsIcon,
	Icon,
	LightningIcon,
	LockKeyIcon,
	MedalIcon,
	RocketLaunchIcon,
	SealCheckIcon,
	ShieldCheckIcon,
	StackIcon,
	StarIcon,
	TrophyIcon,
	UsersIcon,
} from "@phosphor-icons/react";
import React from "react";
import {
	type Achievement,
	achievementDefinitions,
} from "@/lib/data/achievement-definitions";

const iconMap: Record<string, Icon> = {
	Footprints: FootprintsIcon,
	Trophy: TrophyIcon,
	Lightning: LightningIcon,
	CalendarCheck: CalendarCheckIcon,
	Calendar: CalendarIcon,
	Fire: FireIcon,
	Cpu: CpuIcon,
	ShieldCheck: ShieldCheckIcon,
	Stack: StackIcon,
	Users: UsersIcon,
	ChatCircle: ChatCircleIcon,
	Star: StarIcon,
	SealCheck: SealCheckIcon,
	Bug: BugIcon,
	Medal: MedalIcon,
	RocketLaunch: RocketLaunchIcon,
};

interface BadgeShowcaseProps {
	achievements: Achievement[];
	maxSlots?: number;
}

export function BadgeShowcase({
	achievements,
	maxSlots = 8,
}: BadgeShowcaseProps) {
	const earnedIds = new Set(achievements.map((a) => a.id));

	// Combine earned with remaining definitions
	const displayItems = [
		...achievements,
		...achievementDefinitions.filter((def) => !earnedIds.has(def.id)),
	].slice(0, maxSlots);

	const slots = Array.from(
		{ length: maxSlots },
		(_, i) => displayItems[i] || null,
	);

	return (
		<div className="border border-border p-6 bg-bg-surface relative overflow-hidden group h-full">
			<div className="flex justify-between items-baseline mb-6">
				<span className="text-[10px] uppercase tracking-widest font-bold text-ink-secondary/60">
					ACHIEVEMENTS {"//"} SHOWCASE
				</span>
			</div>

			<div className="grid grid-cols-4 gap-4 relative z-10">
				{slots.map((item, index) => {
					const isUnlocked = item ? earnedIds.has(item.id) : false;
					const IconComponent = item
						? iconMap[item.icon] || TrophyIcon
						: LockKeyIcon;

					return (
						<div
							key={index}
							className={`aspect-square border flex items-center justify-center text-2xl relative group/item transition-all duration-500 overflow-hidden ${
								isUnlocked
									? "border-ink-primary bg-ink-primary/5 text-ink-primary hover:bg-ink-primary hover:text-bg-base cursor-help"
									: "border-dashed border-ink-secondary/20 bg-ink-secondary/2 text-ink-secondary/20"
							}`}
							title={item?.name || "Locked Milestone"}
						>
							<div
								className={`transition-transform duration-500 group-hover/item:scale-110 ${!isUnlocked ? "opacity-30 grayscale" : "opacity-100"}`}
							>
								<IconComponent
									weight={isUnlocked ? "duotone" : "thin"}
									size={24}
								/>
							</div>

							{/* Lock for locked */}
							{!isUnlocked && (
								<div className="absolute inset-0 flex items-center justify-center">
									<LockKeyIcon
										weight="fill"
										size={12}
										className="text-ink-secondary/30"
									/>
								</div>
							)}

							{/* Hover Label */}
							{item && (
								<div className="absolute -bottom-1 left-0 right-0 opacity-0 group-hover/item:opacity-100 transition-all bg-ink-primary text-[8px] text-bg-base text-center py-0.5 pointer-events-none translate-y-full group-hover/item:translate-y-0 duration-300 z-10 uppercase tracking-tighter">
									{item.name}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Grid decoration */}
			<div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden pointer-events-none opacity-10">
				<div className="absolute bottom-0 right-0 w-px h-full bg-ink-primary"></div>
				<div className="absolute bottom-0 right-0 w-full h-px bg-ink-primary"></div>
			</div>
		</div>
	);
}
