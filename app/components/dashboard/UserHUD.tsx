/**
 * @fileoverview UserHUD (Heads-Up Display) component for the dashboard.
 * Displays key user metrics: XP balance, global rank, and level progress.
 */

"use client";

import { CoinsIcon, GlobeIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { StatCard } from "@/components/shared/StatCard";
import { Progress } from "@/components/ui/progress";
import { UserStats } from "@/lib/data/user";

interface UserHUDProps {
	stats: UserStats;
}

export function UserHUD({ stats }: UserHUDProps) {
	const t = useTranslations("Dashboard.userHUD");

	return (
		<div className="border border-border p-4 relative">
			<span className="absolute -top-2.5 left-3 bg-bg-base px-2 text-[10px] uppercase tracking-widest font-bold">
				{t("title")}
			</span>

			<div className="grid grid-cols-2 gap-4 mb-4">
				<StatCard
					label={t("xpBalance")}
					value={stats.xp.toLocaleString()}
					icon={<CoinsIcon size={16} weight="duotone" />}
				/>
				<StatCard
					label={t("globalRank")}
					value={`#${stats.globalRank.toLocaleString()}`}
					icon={<GlobeIcon size={16} weight="duotone" />}
				/>
			</div>

			<div className="mt-4">
				<div className="flex justify-between text-[10px] mb-1">
					<span className="uppercase font-bold tracking-widest">
						{t("level")} {stats.level}
					</span>
					<span className="text-ink-secondary uppercase tracking-widest">
						{stats.xpToNextLevel.toLocaleString()} {t("xpToLevel")}{" "}
						{stats.level + 1}
					</span>
				</div>
				<Progress value={stats.levelProgress} />
			</div>
		</div>
	);
}
