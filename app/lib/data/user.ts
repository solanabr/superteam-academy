/**
 * @fileoverview Data access layer for user-centric information.
 * Handles fetching of user profiles, statistics, course progress, and activity streaks.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Course } from "@/lib/data/courses";
import { db } from "@/lib/db";
import {
	courseProgress,
	streak as streakTable,
	userActivity,
	user as userTable,
} from "@/lib/db/schema";
import { ALL_COURSES_QUERY, client } from "@/sanity/client";
import { getCurrentUserRank } from "./leaderboard";

/**
 * High-level progress tracking for a single course enrollment.
 */
export interface CourseProgress {
	courseId: string;
	courseCode: string; // e.g., "RUST-101"
	courseTitle: string;
	progress: number; // 0-100
	currentLesson?: {
		id: string;
		title: string;
	};
	completed: boolean;
}

/**
 * Recommended course metadata.
 */
export interface RecommendedCourse {
	id: string;
	code: string;
	title: string;
	difficulty: "BEG" | "INT" | "ADV";
}

/**
 * Represents a single day in the user's activity streak.
 */
export interface StreakDay {
	date: string;
	active: boolean;
}

/**
 * Detailed user profile information.
 */
export interface UserProfile {
	id: string;
	username: string;
	displayName: string;
	walletAddress: string;
	avatar?: string;
	avatarSeed?: string;
	bio?: string;
	location?: string;
	enrolledSince: string;
	socialLinks: {
		github?: string;
		githubHandle?: string;
		twitter?: string;
		twitterHandle?: string;
		portfolio?: string;
		portfolioDisplay?: string;
	};
	isPublic: boolean;
	reputation?: number;
	level?: number;
}

/**
 * User activity statistics and level progress.
 */
export interface UserStats {
	xp: number;
	level: number;
	xpToNextLevel: number;
	levelProgress: number; // 0-100
	globalRank: number;
	streak: {
		current: number;
		calendar: StreakDay[];
	};
}

// Mock user profile
export const mockUserProfile: UserProfile = {
	id: "user-9402",
	username: "0xKONRAD",
	displayName: "0xKONRAD",
	walletAddress: "0xKD...92A",
	bio: "Senior Solana Dev specializing in Anchor and Program Security. Building decentralized economies since 2021.",
	location: "BERLIN_DE",
	enrolledSince: "OCT_2023",
	socialLinks: {
		github: "https://github.com/0xkonrad",
		twitter: "https://twitter.com/0xkonrad",
		portfolio: "https://0xkonrad.dev",
	},
	isPublic: true,
};

/**
 * Fetches active course progress for the user from the database.
 */
export async function getActiveCourses(
	userId: string,
): Promise<CourseProgress[]> {
	if (!userId) return [];

	const inProgress = await db
		.select({
			courseId: courseProgress.courseId,
			progress: courseProgress.progress,
			currentLessonIndex: courseProgress.currentLessonIndex,
			completed: sql<boolean>`${courseProgress.completedAt} IS NOT NULL`,
		})
		.from(courseProgress)
		.where(
			and(
				eq(courseProgress.userId, userId),
				sql`${courseProgress.completedAt} IS NULL`,
				sql`${courseProgress.progress} > 0`,
			),
		)
		.orderBy(desc(courseProgress.lastAccessedAt))
		.limit(6);

	return inProgress.map((p) => ({
		courseId: p.courseId,
		courseCode: p.courseId
			.split("-")
			.map((s) => s.toUpperCase())
			.join("-"),
		courseTitle: p.courseId
			.split("-")
			.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
			.join(" "),
		progress: Math.min(100, Math.max(0, p.progress || 0)),
		completed: p.completed,
		currentLesson: {
			id: `lesson-${p.currentLessonIndex}`,
			title: `Lesson ${(p.currentLessonIndex ?? 0) + 1}`,
		},
	}));
}

/**
 * @deprecated Use getUserStats(userId) instead
 */
export function getMockUserStats(): UserStats {
	return {
		xp: 8420,
		level: 9,
		xpToNextLevel: 1580,
		levelProgress: 82,
		globalRank: 2104,
		streak: {
			current: 12,
			calendar: [], // Not generating for mock anymore
		},
	};
}

/**
 * Fetches recommended courses for the user.
 */
export async function getRecommendedCourses(
	userId: string,
): Promise<RecommendedCourse[]> {
	if (!userId) return [];

	try {
		// Fetch all courses from Sanity exactly as the Courses page does
		const allCourses = await client.fetch<Course[]>(
			ALL_COURSES_QUERY,
			{},
			{ cache: "no-store" },
		);

		return allCourses.slice(0, 3).map((c) => {
			let diffStr: "BEG" | "INT" | "ADV" = "BEG";
			if (c.difficulty === 2 || c.difficulty === "2") diffStr = "INT";
			if (c.difficulty === 3 || c.difficulty === "3") diffStr = "ADV";

			return {
				id: c._id || c.slug,
				code: (c.tag || c.slug).toUpperCase().substring(0, 8),
				title: c.title,
				difficulty: diffStr,
			};
		});
	} catch (error) {
		console.error("Failed to fetch recommended courses:", error);
		return [];
	}
}

/**
 * Helper functions (UserProfile still mock)
 */
export function getUserProfile(): UserProfile {
	return mockUserProfile;
}

/**
 * Internal helper to generate streak day data for a given range.
 */
async function getStreakDays(
	userId: string,
	daysCount: number,
): Promise<StreakDay[]> {
	const days: StreakDay[] = [];
	const today = new Date();
	const startDate = new Date();
	startDate.setDate(today.getDate() - (daysCount - 1));
	startDate.setHours(0, 0, 0, 0);

	const activities = await db
		.select({
			date: sql<string>`DATE(${userActivity.createdAt})::text`,
		})
		.from(userActivity)
		.where(
			and(
				eq(userActivity.userId, userId),
				gte(userActivity.createdAt, startDate),
			),
		)
		.groupBy(sql`DATE(${userActivity.createdAt})`);

	const activeDates = new Set(activities.map((a) => a.date));

	for (let i = daysCount - 1; i >= 0; i--) {
		const date = new Date(today);
		date.setDate(date.getDate() - i);
		const dateStr = date.toISOString().split("T")[0];
		days.push({
			date: dateStr,
			active: activeDates.has(dateStr),
		});
	}

	return days;
}

/**
 * Fetches real user statistics from the database.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
	if (!userId) {
		return {
			xp: 0,
			level: 1,
			xpToNextLevel: 100,
			levelProgress: 0,
			globalRank: 0,
			streak: { current: 0, calendar: [] },
		};
	}

	// 1. Fetch User and Streak data
	const [userData] = await db
		.select({
			totalXp: userTable.totalXp,
			level: userTable.level,
		})
		.from(userTable)
		.where(eq(userTable.id, userId));

	const [streakData] = await db
		.select({
			currentStreak: streakTable.currentStreak,
		})
		.from(streakTable)
		.where(eq(streakTable.userId, userId));

	// 2. Fetch Rank
	const globalRank = await getCurrentUserRank(userId);

	// 3. Generate Streak Calendar (last 14 days)
	const days = await getStreakDays(userId, 14);

	const xp = userData?.totalXp || 0;
	const level = userData?.level || 1;

	// Level formula: level = floor(sqrt(xp / 100))
	const currentLevelXp = 100 * Math.pow(level, 2);
	const nextLevelXp = 100 * Math.pow(level + 1, 2);
	const xpInCurrentLevel = xp - currentLevelXp;
	const xpRequiredForNext = nextLevelXp - currentLevelXp;

	const levelProgress = Math.min(
		100,
		Math.max(0, Math.floor((xpInCurrentLevel / xpRequiredForNext) * 100)),
	);
	const xpToNextLevel = Math.max(0, nextLevelXp - xp);

	return {
		xp,
		level,
		xpToNextLevel,
		levelProgress,
		globalRank,
		streak: {
			current: streakData?.currentStreak || 0,
			calendar: days,
		},
	};
}

/**
 * Fetches extended streak history for the profile graph.
 */
export async function getUserStreakHistory(
	userId: string,
	daysCount: number = 90,
): Promise<StreakDay[]> {
	return getStreakDays(userId, daysCount);
}
