/**
 * @fileoverview Client component for the Challenges listing with filtering and analytics.
 * Renders challenge cards with difficulty badges, category filters, and completion states.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
	ClockIcon,
	FunnelIcon,
	SwordIcon,
	TrophyIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import type { ChallengeCard } from "@/lib/data/daily-challenge";

interface ChallengesListClientProps {
	dailyChallenge: ChallengeCard | null;
	upcomingChallenges: ChallengeCard[];
	regularChallenges: ChallengeCard[];
	completedSlugs: string[];
}

const DIFFICULTY_LABELS: Record<number, string> = {
	1: "BEGINNER",
	2: "INTERMEDIATE",
	3: "ADVANCED",
};

const DIFFICULTY_COLORS: Record<number, string> = {
	1: "text-green-600 dark:text-green-400 border-green-200 dark:border-green-400/30 bg-green-50 dark:bg-green-400/5",
	2: "text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-400/30 bg-yellow-50 dark:bg-yellow-400/5",
	3: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-400/5",
};

import {
	useChallenges,
	useUserChallengeHistory,
} from "@/lib/hooks/use-challenges";

export function ChallengesListClient({
	dailyChallenge: initialDailyChallenge,
	upcomingChallenges: initialUpcomingChallenges,
	regularChallenges: initialRegularChallenges,
	completedSlugs: initialCompletedSlugs,
}: ChallengesListClientProps) {
	const t = useTranslations("Challenges");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(
		null,
	);

	// TanStack Query for caching and syncing
	const { data: challenges = [] } = useChallenges();
	const { data: history = [] } = useUserChallengeHistory();

	const completedSet = new Set(
		history.length > 0
			? history.filter((h) => h.passed).map((h) => h.challengeSlug)
			: initialCompletedSlugs,
	);

	const today = new Date().toISOString().split("T")[0];

	// If we have query data, use it; otherwise fallback to initial props
	const dailyChallenge =
		challenges.length > 0
			? challenges.find((c) => c.scheduledDate === today) ||
				initialDailyChallenge
			: initialDailyChallenge;

	const upcomingChallenges =
		challenges.length > 0
			? challenges.filter(
					(c) =>
						c.scheduledDate &&
						c.scheduledDate > today &&
						c.slug !== dailyChallenge?.slug,
				)
			: initialUpcomingChallenges;

	const regularChallenges =
		challenges.length > 0
			? challenges.filter((c) => !c.scheduledDate || c.scheduledDate <= today)
			: initialRegularChallenges;

	const CATEGORIES = [
		{ value: "all", label: t("filters.all") },
		{ value: "fundamentals", label: t("filters.fundamentals") },
		{ value: "rust-anchor", label: t("filters.rustAnchor") },
		{ value: "defi", label: t("filters.defi") },
		{ value: "frontend", label: t("filters.frontend") },
		{ value: "security", label: t("filters.security") },
		{ value: "token-extensions", label: t("filters.tokenExtensions") },
	];

	const filteredChallenges = regularChallenges.filter((c) => {
		if (selectedCategory !== "all" && c.category !== selectedCategory)
			return false;
		if (selectedDifficulty && c.difficulty !== selectedDifficulty) return false;
		return true;
	});

	const renderChallengeCard = (challenge: ChallengeCard, isHero = false) => {
		const isCompleted = completedSet.has(challenge.slug);
		const isUpcoming =
			challenge.scheduledDate && challenge.scheduledDate > today;

		if (isHero) {
			return (
				<Link
					href={`/challenges/${challenge.slug}`}
					onClick={() => {
						sendGAEvent("event", "challenge_click", {
							challenge_slug: challenge.slug,
							challenge_type: "daily",
						});
					}}
				>
					<div className="group border border-yellow-400/40 bg-white/60 dark:bg-bg-surface p-6 transition-all hover:border-yellow-400 hover:shadow-[12px_12px_0_rgba(250,204,21,0.1)] dark:hover:shadow-[12px_12px_0_rgba(250,204,21,0.2)] hover:translate-x-[-6px] hover:translate-y-[-6px] relative overflow-hidden backdrop-blur-md">
						{/* Corner accents */}
						<div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-yellow-400" />
						<div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-yellow-400" />

						<div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<span
										className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border ${DIFFICULTY_COLORS[challenge.difficulty]}`}
									>
										{t(
											`filters.${DIFFICULTY_LABELS[challenge.difficulty]?.toLowerCase()}`,
										) || t("hero.unknownDifficulty")}
									</span>
									{challenge.category && (
										<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
											{challenge.category}
										</span>
									)}
								</div>
								<h2 className="font-display font-bold text-xl lg:text-3xl uppercase leading-tight group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
									{challenge.title}
								</h2>
								{challenge.description && (
									<p className="text-ink-secondary text-sm mt-2 line-clamp-2 font-mono max-w-2xl">
										{challenge.description}
									</p>
								)}
							</div>

							<div className="flex flex-col items-end gap-2 shrink-0">
								<div className="flex items-center gap-4">
									<div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
										<span className="font-mono font-bold text-lg">
											{challenge.xpReward} XP
										</span>
									</div>
									{isCompleted && (
										<span className="text-[10px] uppercase font-bold tracking-widest text-green-600 dark:text-green-400 px-3 py-1 border border-green-400/30">
											{t("hero.completed")}
										</span>
									)}
								</div>
								{!isCompleted && (
									<span className="text-xs uppercase font-bold tracking-widest text-yellow-600 dark:text-yellow-400 group-hover:translate-x-1 transition-transform">
										{t("hero.startBtn")}
									</span>
								)}
							</div>
						</div>
					</div>
				</Link>
			);
		}

		if (isUpcoming) {
			return (
				<div
					key={challenge._id}
					className="group border border-border bg-white/50 dark:bg-bg-surface p-5 transition-all relative h-full flex flex-col shadow-sm opacity-60 hover:opacity-100 hover:border-ink-secondary/30 hover:shadow-[6px_6px_0_rgba(0,0,0,0.02)] cursor-default"
				>
					{/* Category + Difficulty */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<span
								className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border ${DIFFICULTY_COLORS[challenge.difficulty]}`}
							>
								{t(
									`filters.${DIFFICULTY_LABELS[challenge.difficulty]?.toLowerCase()}`,
								) || "—"}
							</span>
							{challenge.category && (
								<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
									{challenge.category}
								</span>
							)}
						</div>
						<ClockIcon size={14} className="text-ink-tertiary" />
					</div>

					{/* Title */}
					<h3 className="font-display font-bold text-base uppercase leading-tight mb-2 text-ink-secondary">
						{challenge.title}
					</h3>

					{/* Description */}
					{challenge.description && (
						<p className="text-ink-secondary text-xs font-mono line-clamp-2 mb-4 flex-1">
							{challenge.description}
						</p>
					)}

					{/* Footer */}
					<div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-secondary/10">
						<div className="flex items-center gap-1.5 text-ink-secondary">
							<span className="font-mono text-[11px] font-bold">
								{challenge.xpReward} XP
							</span>
						</div>
						{challenge.scheduledDate && (
							<div className="flex items-center gap-1 text-ink-secondary">
								<span className="font-mono text-[10px]">
									{t("card.releases")} {challenge.scheduledDate}
								</span>
							</div>
						)}
					</div>
				</div>
			);
		}

		return (
			<Link
				key={challenge._id}
				href={`/challenges/${challenge.slug}`}
				onClick={() => {
					sendGAEvent("event", "challenge_click", {
						challenge_slug: challenge.slug,
						challenge_type: challenge.scheduledDate ? "daily" : "regular",
					});
				}}
			>
				<div
					className={`group border bg-white/50 dark:bg-bg-surface p-5 transition-all relative h-full flex flex-col shadow-sm ${
						isCompleted
							? "border-green-400/30 hover:border-green-400 bg-green-50/30 dark:bg-green-400/5"
							: "border-border hover:border-ink-primary hover:shadow-[8px_8px_0_rgba(0,0,0,0.03)] dark:hover:shadow-[8px_8px_0_var(--color-border)] hover:translate-x-[-4px] hover:translate-y-[-4px]"
					}`}
				>
					{/* Corner accents */}
					<>
						<div
							className={`absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity ${isCompleted ? "border-green-400" : "border-ink-primary"}`}
						/>
						<div
							className={`absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity ${isCompleted ? "border-green-400" : "border-ink-primary"}`}
						/>
					</>

					{/* Category + Difficulty */}
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<span
								className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border ${DIFFICULTY_COLORS[challenge.difficulty]}`}
							>
								{t(
									`filters.${DIFFICULTY_LABELS[challenge.difficulty]?.toLowerCase()}`,
								) || "—"}
							</span>
							{challenge.category && (
								<span className="text-[10px] uppercase tracking-widest text-ink-secondary">
									{challenge.category}
								</span>
							)}
						</div>
						{isCompleted ? (
							<TrophyIcon size={14} weight="fill" className="text-green-500" />
						) : (
							isUpcoming && (
								<ClockIcon size={14} className="text-ink-tertiary" />
							)
						)}
					</div>

					{/* Title */}
					<h3 className="font-display font-bold text-base uppercase leading-tight mb-2 group-hover:text-ink-primary transition-colors">
						{challenge.title}
					</h3>

					{/* Description */}
					{challenge.description && (
						<p className="text-ink-secondary text-xs font-mono line-clamp-2 mb-4 flex-1">
							{challenge.description}
						</p>
					)}

					{/* Footer */}
					<div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-secondary/10">
						<div className="flex items-center gap-1.5 text-ink-secondary">
							<span className="font-mono text-[11px] font-bold">
								{challenge.xpReward} XP
							</span>
						</div>
						{isCompleted ? (
							<span className="text-[10px] uppercase font-bold tracking-widest text-green-600 dark:text-green-400">
								{t("card.completed")}
							</span>
						) : (
							<span className="text-[10px] uppercase font-bold tracking-widest text-ink-secondary group-hover:text-ink-primary transition-colors">
								{t("card.startBtn")}
							</span>
						)}
					</div>
				</div>
			</Link>
		);
	};

	return (
		<div className="relative z-10 flex flex-col gap-12">
			{/* Section 1: Today's Daily Challenge */}
			{dailyChallenge && (
				<section>
					<div className="text-[11px] uppercase font-bold tracking-widest text-ink-secondary mb-4 flex items-center gap-2">
						{t("hero.liveLabel")}
					</div>
					{renderChallengeCard(dailyChallenge, true)}
				</section>
			)}

			{/* Section 2: Upcoming Challenges */}
			{upcomingChallenges.length > 0 && (
				<section>
					<div className="text-[11px] uppercase font-bold tracking-widest text-ink-secondary mb-4 flex items-center gap-2">
						{t("sections.updatingMissions")}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{upcomingChallenges.map((c) => renderChallengeCard(c))}
					</div>
				</section>
			)}

			{/* Section 3: All Challenges */}
			<section>
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
					<div className="text-[11px] uppercase font-bold tracking-widest text-ink-secondary flex items-center gap-2">
						{t("sections.allMissions")} ({filteredChallenges.length})
					</div>

					{/* Filters */}
					<div className="flex flex-wrap items-center gap-2">
						<FunnelIcon size={12} className="text-ink-secondary mr-1" />
						{/* Category filters */}
						{CATEGORIES.map((cat) => (
							<button
								key={cat.value}
								type="button"
								onClick={() => {
									setSelectedCategory(cat.value);
									sendGAEvent("event", "challenge_filter", {
										filter_type: "category",
										filter_value: cat.value,
									});
								}}
								className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 border transition-colors ${
									selectedCategory === cat.value
										? "border-ink-primary bg-ink-primary text-bg-base"
										: "border-border text-ink-secondary hover:border-ink-primary/50"
								}`}
							>
								{cat.label}
							</button>
						))}

						<div className="w-px h-3 bg-ink-secondary/20 mx-1" />

						{/* Difficulty filters */}
						{[1, 2, 3].map((d) => (
							<button
								key={d}
								type="button"
								onClick={() => {
									setSelectedDifficulty(selectedDifficulty === d ? null : d);
									sendGAEvent("event", "challenge_filter", {
										filter_type: "difficulty",
										filter_value: t(
											`filters.${DIFFICULTY_LABELS[d]?.toLowerCase()}`,
										),
									});
								}}
								className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 border transition-colors ${
									selectedDifficulty === d
										? "border-ink-primary bg-ink-primary text-bg-base"
										: "border-border text-ink-secondary hover:border-ink-primary/50"
								}`}
							>
								{t(`filters.${DIFFICULTY_LABELS[d]?.toLowerCase()}`)}
							</button>
						))}
					</div>
				</div>

				{/* All Challenge Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{filteredChallenges.map((challenge) =>
						renderChallengeCard(challenge),
					)}
				</div>

				{/* Empty State */}
				{filteredChallenges.length === 0 && (
					<div className="text-center py-20 border border-dashed border-border bg-bg-surface/30">
						<SwordIcon
							size={48}
							className="mx-auto text-ink-secondary/20 mb-4"
						/>
						<p className="text-ink-secondary font-mono text-sm">
							{t("emptyState")}
						</p>
					</div>
				)}
			</section>
		</div>
	);
}
