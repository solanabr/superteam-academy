/**
 * @fileoverview Reusable filter components for the course catalog, including search and dropdowns.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import {
	BuildingsIcon,
	CodeIcon,
	SquaresFourIcon,
	TerminalIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	LeaderboardTrack,
	TRACK_COLLECTIONS,
} from "@/lib/constants/leaderboard";
import { cn } from "@/lib/utils";

interface CourseFiltersProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	activeCategory: string;
	onCategoryChange: (category: string) => void;
	activeTrack: LeaderboardTrack;
	onTrackChange: (track: LeaderboardTrack) => void;
	activeDifficulty: string;
	onDifficultyChange: (difficulty: string) => void;
	activeDuration: string;
	onDurationChange: (duration: string) => void;
}

const trackOptions = [
	{ value: "all", label: "FILTER: ALL TRACKS" },
	{ value: TRACK_COLLECTIONS[1], label: "RUST FUNDAMENTALS" },
	{ value: TRACK_COLLECTIONS[2], label: "ANCHOR FRAMEWORK" },
	{ value: TRACK_COLLECTIONS[3], label: "DEFI PROTOCOLS" },
	{ value: TRACK_COLLECTIONS[4], label: "SECURITY & AUDITING" },
	{ value: TRACK_COLLECTIONS[5], label: "FRONTEND DEVELOPMENT" },
];

const difficultyOptions = [
	{ value: "all", label: "difficulty.all" },
	{ value: "1", label: "difficulty.beginner" },
	{ value: "2", label: "difficulty.intermediate" },
	{ value: "3", label: "difficulty.advanced" },
];

const durationOptions = [
	{ value: "all", label: "duration.all" },
	{ value: "short", label: "duration.short" }, // < 1h
	{ value: "medium", label: "duration.medium" }, // 1-4h
	{ value: "long", label: "duration.long" }, // > 4h
];

/**
 * CourseFilters Component
 * Provides UI for searching and filtering courses by category, track, difficulty, and duration.
 */
export function CourseFilters({
	searchQuery,
	onSearchChange,
	activeCategory,
	onCategoryChange,
	activeTrack,
	onTrackChange,
	activeDifficulty,
	onDifficultyChange,
	activeDuration,
	onDurationChange,
}: CourseFiltersProps) {
	const t = useTranslations("Courses");

	const categories: {
		id: string;
		icon: typeof SquaresFourIcon;
		label: string;
	}[] = [
		{ id: "all", icon: SquaresFourIcon, label: t("filters.all") },
		{ id: "dev", icon: CodeIcon, label: t("filters.dev") },
		{ id: "defi", icon: BuildingsIcon, label: t("filters.defi") },
	];

	const activeFilters = [
		...(activeCategory !== "all"
			? [`CATEGORY: ${activeCategory.toUpperCase()}`]
			: []),
		...(activeTrack !== "all"
			? [
					`TRACK: ${trackOptions.find((o) => o.value === activeTrack)?.label.replace("FILTER: ", "")}`,
				]
			: []),
		...(activeDifficulty !== "all"
			? [
					`DIFFICULTY: ${t(`difficulty.${difficultyOptions.find((o) => o.value === activeDifficulty)?.label.split(".")[1]}`)}`,
				]
			: []),
		...(activeDuration !== "all"
			? [`DURATION: ${activeDuration.toUpperCase()}`]
			: []),
	];

	const removeFilter = (filter: string) => {
		if (filter.startsWith("CATEGORY:")) onCategoryChange("all");
		if (filter.startsWith("TRACK:")) onTrackChange("all");
		if (filter.startsWith("DIFFICULTY:")) onDifficultyChange("all");
		if (filter.startsWith("DURATION:")) onDurationChange("all");
	};

	return (
		<div className="space-y-4">
			{/* Search Bar - Full Width on Top */}
			<div className="h-10 border border-ink-secondary/20 flex items-center px-4 bg-bg-surface transition-all focus-within:border-ink-primary focus-within:ring-1 focus-within:ring-ink-primary/5 rounded-none">
				<TerminalIcon className="text-ink-secondary mr-3" size={14} />
				<input
					type="text"
					className="border-none bg-transparent w-full font-mono text-base md:text-[12px] text-ink-primary placeholder:text-ink-secondary/50 focus:outline-none"
					placeholder={t("search.placeholder")}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
				<span className="text-[10px] text-ink-secondary uppercase tracking-widest animate-pulse">
					_
				</span>
			</div>

			<div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between bg-bg-surface/50 p-4 border border-ink-secondary/10">
				{/* Category Buttons */}
				<div className="flex flex-wrap gap-2 order-2 xl:order-1">
					{categories.map((cat) => {
						const Icon = cat.icon;
						return (
							<button
								key={cat.id}
								onClick={() => {
									onCategoryChange(cat.id);
									posthog.capture("course_category_selected", {
										category: cat.id,
									});
									sendGAEvent("event", "filter_selection", {
										filter_type: "category",
										filter_value: cat.id,
									});
								}}
								className={cn(
									"border border-border px-4 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all justify-center h-10 min-w-[100px]",
									activeCategory === cat.id
										? "bg-ink-primary text-bg-base border-ink-primary"
										: "bg-transparent text-ink-primary hover:bg-ink-primary/5 border-ink-secondary/20",
								)}
							>
								<Icon
									size={14}
									weight={activeCategory === cat.id ? "fill" : "regular"}
								/>
								{cat.label}
							</button>
						);
					})}
				</div>

				{/* Dropdowns Row - Difficulty, Duration, Track */}
				<div className="w-full xl:w-auto flex flex-col md:flex-row gap-3 order-1 xl:order-2">
					{/* Difficulty */}
					<div className="w-full md:w-[180px]">
						<Select
							value={activeDifficulty}
							onValueChange={(v) => {
								onDifficultyChange(v);
								posthog.capture("course_difficulty_selected", {
									difficulty: v,
								});
								sendGAEvent("event", "filter_selection", {
									filter_type: "difficulty",
									filter_value: v,
								});
							}}
						>
							<SelectTrigger className="w-full h-10 px-4 text-[10px] uppercase tracking-widest border-ink-secondary/20 bg-bg-surface text-ink-primary font-bold focus:ring-ink-primary/5 rounded-none flex items-center justify-between">
								<div className="flex items-center gap-1.5 overflow-hidden">
									<span className="text-ink-secondary opacity-60 shrink-0 font-medium">
										DIFFICULTY:
									</span>
									<div className="truncate">
										<SelectValue placeholder={t("filters.difficulty")} />
									</div>
								</div>
							</SelectTrigger>
							<SelectContent className="bg-bg-surface border-ink-secondary/20">
								{difficultyOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
										className="text-[10px] uppercase tracking-widest focus:bg-ink-primary focus:text-bg-base"
									>
										{option.value === "all"
											? t("filters.all")
											: t(option.label)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Duration */}
					<div className="w-full md:w-[180px]">
						<Select
							value={activeDuration}
							onValueChange={(v) => {
								onDurationChange(v);
								posthog.capture("course_duration_selected", { duration: v });
								sendGAEvent("event", "filter_selection", {
									filter_type: "duration",
									filter_value: v,
								});
							}}
						>
							<SelectTrigger className="w-full h-10 px-4 text-[10px] uppercase tracking-widest border-ink-secondary/20 bg-bg-surface text-ink-primary font-bold focus:ring-ink-primary/5 rounded-none flex items-center justify-between">
								<div className="flex items-center gap-1.5 overflow-hidden">
									<span className="text-ink-secondary opacity-60 shrink-0 font-medium">
										DURATION:
									</span>
									<div className="truncate">
										<SelectValue placeholder={t("filters.duration")} />
									</div>
								</div>
							</SelectTrigger>
							<SelectContent className="bg-bg-surface border-ink-secondary/20">
								{durationOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
										className="text-[10px] uppercase tracking-widest focus:bg-ink-primary focus:text-bg-base"
									>
										{option.value === "all"
											? t("filters.all")
											: option.value === "short"
												? "< 1H"
												: option.value === "medium"
													? "1-4H"
													: "> 4H"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Track Filter Dropdown */}
					<div className="w-full md:w-[240px]">
						<Select
							value={activeTrack}
							onValueChange={(v) => {
								const track = v as LeaderboardTrack;
								onTrackChange(track);
								posthog.capture("course_track_selected", { track });
								sendGAEvent("event", "filter_selection", {
									filter_type: "track",
									filter_value: track,
								});
							}}
						>
							<SelectTrigger className="w-full h-10 px-4 text-[10px] uppercase tracking-widest border-ink-secondary/20 bg-bg-surface text-ink-primary font-bold focus:ring-ink-primary/5 rounded-none flex items-center justify-between">
								<div className="flex items-center gap-1.5 overflow-hidden">
									<span className="text-ink-secondary opacity-60 shrink-0 font-medium">
										TRACK:
									</span>
									<div className="truncate text-left">
										<SelectValue placeholder="FILTER BY TRACK" />
									</div>
								</div>
							</SelectTrigger>
							<SelectContent className="bg-bg-surface border-ink-secondary/20">
								{trackOptions.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
										className="text-[10px] uppercase tracking-widest focus:bg-ink-primary focus:text-bg-base"
									>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Active Filters */}
			{activeFilters.length > 0 && (
				<div className="flex flex-wrap gap-2 items-center">
					<span className="text-[10px] uppercase tracking-widest text-ink-secondary py-1.5">
						{t("filters.active")}:
					</span>
					{activeFilters.map((filter) => (
						<div
							key={filter}
							className="text-[10px] uppercase tracking-widest px-2 py-1 border border-border bg-ink-primary text-bg-base flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
							onClick={() => removeFilter(filter)}
						>
							{filter} <XIcon size={10} />
						</div>
					))}
					<button
						onClick={() => {
							onCategoryChange("all");
							onTrackChange("all");
							onDifficultyChange("all");
							onDurationChange("all");
							posthog.capture("course_filters_cleared");
						}}
						className="text-[9px] uppercase tracking-widest text-ink-secondary hover:text-ink-primary ml-2 underline underline-offset-4"
					>
						CLEAR ALL
					</button>
				</div>
			)}
		</div>
	);
}
