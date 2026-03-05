/**
 * @fileoverview AchievementGrid component for the dashboard.
 * Renders a grid of earned and locked achievements/milestones.
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
import { useTranslations } from "next-intl";
import {
	Achievement,
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

interface AchievementGridProps {
	achievements: Achievement[];
	maxSlots?: number;
}

export function AchievementGrid({
	achievements,
	maxSlots = 8,
}: AchievementGridProps) {
	const t = useTranslations("Dashboard");

	// Create a combined list: user's earned achievements first, then remaining definitions
	const earnedIds = new Set(achievements.map((a) => a.id));

	// Fill slots:
	// 1. Earned achievements
	// 2. Remaining definition slots (up to maxSlots)
	const displayAchievements = [
		...achievements,
		...achievementDefinitions.filter((def) => !earnedIds.has(def.id)),
	].slice(0, maxSlots);

	const slots = Array.from(
		{ length: maxSlots },
		(_, i) => displayAchievements[i] || null,
	);

	return (
		<div>
			<span className="text-[10px] uppercase tracking-widest font-bold block mb-3 text-ink-secondary/60">
				{t("achievements.missionMilestones")}
			</span>

			<div className="grid grid-cols-4 gap-3">
				{slots.map((item, index) => {
					const isUnlocked = item ? earnedIds.has(item.id) : false;
					const IconComponent = item
						? iconMap[item.icon] || TrophyIcon
						: LockKeyIcon;

					return (
						<div
							key={index}
							className={`aspect-square border flex items-center justify-center text-2xl relative group transition-all duration-500 overflow-hidden ${
								isUnlocked
									? "border-ink-primary bg-ink-primary/5 text-ink-primary"
									: "border-dashed border-ink-secondary/20 bg-ink-secondary/2 text-ink-secondary/30"
							}`}
							title={item?.name || t("achievements.locked")}
						>
							{/* Achievement Icon */}
							<div
								className={`transition-all duration-500 ${!isUnlocked ? "opacity-20 grayscale scale-90" : "opacity-100 scale-100"}`}
							>
								<IconComponent
									weight={isUnlocked ? "duotone" : "thin"}
									size={28}
								/>
							</div>

							{/* Lock Overlay */}
							{!isUnlocked && (
								<div className="absolute inset-0 flex items-center justify-center">
									<LockKeyIcon
										weight="fill"
										size={14}
										className="text-ink-secondary/40"
									/>
								</div>
							)}

							{/* Scanning effect for unlocked */}
							{isUnlocked && (
								<div className="absolute inset-0 pointer-events-none">
									<div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-ink-primary" />
									<div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-ink-primary" />
									<div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-ink-primary" />
									<div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-ink-primary" />

									<div className="absolute inset-0 opacity-[0.03] animate-pulse bg-ink-primary" />
								</div>
							)}

							{/* Hover Info */}
							{item && (
								<div className="absolute -bottom-1 left-0 right-0 opacity-0 group-hover:opacity-100 transition-all bg-ink-primary text-[8px] text-bg-base text-center py-0.5 pointer-events-none translate-y-full group-hover:translate-y-0 duration-300 z-10 uppercase tracking-tighter">
									{item.name}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
