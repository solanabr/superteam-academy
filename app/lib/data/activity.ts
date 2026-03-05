/**
 * @fileoverview Data access layer for user activity logs.
 * Provides functions to fetch and format activity feeds for the dashboard and profile.
 */

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";

/**
 * Represents a single activity log entry.
 */
export interface ActivityItem {
	/** Unique log identifier */
	id: string;
	/** classification for icon/styling */
	type:
		| "lesson_completed"
		| "level_up"
		| "achievement"
		| "course_completed"
		| "enrolled"
		| "challenge_completed";
	/** ISO timestamp */
	timestamp: string;
	/** Human readable event title */
	title: string;
	/** Optional secondary details */
	description?: string;
	/** XP gain for this event */
	xpEarned?: number;
}

/**
 * Fetches the activity feed for a user from the database.
 */
export async function getActivityFeed(
	userId: string,
	limit: number = 10,
): Promise<ActivityItem[]> {
	if (!userId) return [];

	const results = await db
		.select()
		.from(userActivity)
		.where(eq(userActivity.userId, userId))
		.orderBy(desc(userActivity.createdAt))
		.limit(limit);

	return results.map((r) => ({
		id: r.id,
		type: r.type as ActivityItem["type"],
		timestamp: r.createdAt.toISOString(),
		title: r.title,
		description: r.description || undefined,
		xpEarned: r.xpEarned || undefined,
	}));
}

/**
 * Fetches the most recent activity items for a user.
 */
export async function getRecentActivity(
	userId: string,
): Promise<ActivityItem[]> {
	return getActivityFeed(userId, 5);
}
