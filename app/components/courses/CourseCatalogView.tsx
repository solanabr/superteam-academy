/**
 * @fileoverview Main view for the course catalog, handling search and filtering logic.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import {
	LeaderboardTrack,
	TRACK_COLLECTIONS,
} from "@/lib/constants/leaderboard";
import { Course } from "@/lib/data/courses";
import { CourseFilters } from "./CourseFilters";
import { CourseGrid } from "./CourseGrid";

interface CourseCatalogViewProps {
	initialCourses: Course[];
}

/**
 * CourseCatalogView Component
 * Renders the full course catalog with search, category filtering, and track filtering.
 */
export function CourseCatalogView({ initialCourses }: CourseCatalogViewProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("all");
	const [activeTrack, setActiveTrack] = useState<LeaderboardTrack>("all");
	const [activeDifficulty, setActiveDifficulty] = useState("all");
	const [activeDuration, setActiveDuration] = useState("all");

	const filteredCourses = useMemo(() => {
		return initialCourses.filter((course) => {
			// Search filter
			const matchesSearch =
				course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				course.description.toLowerCase().includes(searchQuery.toLowerCase());

			// Category filter (DEV, DEFI)
			const matchesCategory =
				activeCategory === "all" ||
				course.category?.toLowerCase() === activeCategory.toLowerCase() ||
				(activeCategory === "dev" && course.category === "rust") || // Mapping legacy
				(activeCategory === "defi" && course.category === "defi");

			// Track/Collection filter
			const matchesTrack =
				activeTrack === "all" ||
				(course.track_id &&
					TRACK_COLLECTIONS[
						course.track_id as keyof typeof TRACK_COLLECTIONS
					] === activeTrack);

			// Difficulty filter
			const matchesDifficulty =
				activeDifficulty === "all" ||
				course.difficulty.toString() === activeDifficulty;

			// Duration filter
			const mins = course.durationMinutes || 0;
			const matchesDuration =
				activeDuration === "all" ||
				(activeDuration === "short" && mins < 60) ||
				(activeDuration === "medium" && mins >= 60 && mins <= 240) ||
				(activeDuration === "long" && mins > 240);

			return (
				matchesSearch &&
				matchesCategory &&
				matchesTrack &&
				matchesDifficulty &&
				matchesDuration
			);
		});
	}, [
		initialCourses,
		searchQuery,
		activeCategory,
		activeTrack,
		activeDifficulty,
		activeDuration,
	]);

	// Track search queries
	useEffect(() => {
		if (searchQuery.length > 2) {
			const timer = setTimeout(() => {
				posthog.capture("course_search_performed", {
					query: searchQuery,
					results_count: filteredCourses.length,
				});
				sendGAEvent("event", "search", {
					search_term: searchQuery,
				});
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [searchQuery, filteredCourses.length]);

	// Track empty state
	useEffect(() => {
		if (
			filteredCourses.length === 0 &&
			(searchQuery ||
				activeCategory !== "all" ||
				activeTrack !== "all" ||
				activeDifficulty !== "all" ||
				activeDuration !== "all")
		) {
			posthog.capture("course_no_results", {
				query: searchQuery,
				category: activeCategory,
				track: activeTrack,
				difficulty: activeDifficulty,
				duration: activeDuration,
			});
		}
	}, [
		filteredCourses.length,
		searchQuery,
		activeCategory,
		activeTrack,
		activeDifficulty,
		activeDuration,
	]);

	return (
		<div className="space-y-8">
			<CourseFilters
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				activeTrack={activeTrack}
				onTrackChange={setActiveTrack}
				activeDifficulty={activeDifficulty}
				onDifficultyChange={setActiveDifficulty}
				activeDuration={activeDuration}
				onDurationChange={setActiveDuration}
			/>

			{filteredCourses.length > 0 ? (
				<CourseGrid courses={filteredCourses} />
			) : (
				<div className="py-24 border border-dashed border-border flex flex-col items-center justify-center text-center bg-ink-primary/5">
					<div className="text-ink-secondary text-[10px] uppercase tracking-[0.2em] mb-2 font-mono">
						-- [ NO RECORDS IDENTIFIED ] --
					</div>
					<h3 className="font-display font-bold text-2xl uppercase opacity-50">
						No courses match your criteria
					</h3>
					<button
						onClick={() => {
							setSearchQuery("");
							setActiveCategory("all");
							setActiveTrack("all");
							setActiveDifficulty("all");
							setActiveDuration("all");
							posthog.capture("course_filters_reset");
						}}
						className="mt-6 text-[10px] uppercase tracking-widest text-ink-primary underline underline-offset-4 hover:opacity-70 transition-opacity"
					>
						RESET ALL FILTERS
					</button>
				</div>
			)}
		</div>
	);
}
