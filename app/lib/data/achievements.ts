/**
 * @fileoverview Data access layer for user achievements.
 * Connects earned achievement metadata in userActivity with static definitions.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userActivity } from "@/lib/db/schema";

import { Achievement, achievementDefinitions } from "./achievement-definitions";

export type { Achievement };
export { achievementDefinitions };

/**
 * Fetches earned achievements for a user from the database and merges with definitions.
 */
export async function getUserAchievements(
	userId: string,
): Promise<Achievement[]> {
	if (!userId) return [];

	const earned = await db
		.select({
			id: sql<string>`${userActivity.metadata}->>'achievementId'`,
			unlockedAt: userActivity.createdAt,
		})
		.from(userActivity)
		.where(
			and(
				eq(userActivity.userId, userId),
				eq(userActivity.type, "achievement"),
			),
		)
		.orderBy(desc(userActivity.createdAt));

	const achievements = earned
		.map((e) => {
			const def = achievementDefinitions.find((a) => a.id === e.id);
			if (!def) return null;
			return {
				...def,
				unlockedAt: e.unlockedAt.toISOString(),
			} as Achievement;
		})
		.filter((a): a is Achievement => a !== null);

	return achievements;
}

/**
 * Fetches the latest earned achievements for a user.
 */
export async function getLatestAchievements(
	userId: string,
	count: number = 4,
): Promise<Achievement[]> {
	const all = await getUserAchievements(userId);
	return all.slice(0, count);
}
