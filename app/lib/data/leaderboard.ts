/**
 * @fileoverview Data fetching and synchronization logic for the global leaderboard.
 * Provides functions to retrieve rankings, calculate user standing, and sync on-chain XP.
 */

import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
	LeaderboardEntry,
	LeaderboardPeriod,
	LeaderboardTrack,
	UserStanding,
} from "@/lib/constants/leaderboard";
import { db } from "@/lib/db";
import { user, userActivity } from "@/lib/db/schema";
import { onchainQueryService } from "@/lib/services/onchain-queries";

/**
 * Fetches the leaderboard entries based on the specified period and track.
 * Defaults to all-time global rankings.
 *
 * @param period - The time frame to consider for XP aggregation.
 * @param track - The specific learning track to filter by.
 * @returns A list of the top 50 leaderboard entries.
 */
export async function getLeaderboard(
	period: LeaderboardPeriod = "all-time",
	track: LeaderboardTrack = "all",
): Promise<LeaderboardEntry[]> {
	const now = new Date();
	let startDate: Date | undefined;

	if (period === "weekly") {
		startDate = new Date(now.setDate(now.getDate() - 7));
	} else if (period === "monthly") {
		startDate = new Date(now.setMonth(now.getMonth() - 1));
	}

	if (period === "all-time" && track === "all") {
		// Use optimized user table for all-time global leaderboard
		const results = await db
			.select({
				userId: user.id,
				username: user.name,
				walletAddress: user.walletAddress,
				avatar: user.avatarSeed,
				xp: user.totalXp,
				level: user.level,
			})
			.from(user)
			.orderBy(desc(user.totalXp))
			.limit(50);

		return results.map((r, i) => ({
			rank: i + 1,
			userId: r.userId,
			username: r.username,
			walletAddress: r.walletAddress || "Unknown",
			avatar: r.avatar || "bi-person-fill",
			xp: r.xp,
			level: r.level,
			streak: 0, // Streaks would need a join but we'll stub for performance or fetch separately
		}));
	}

	// For filtered leaderboards, we aggregate user_activity by track collection
	const conditions = [];
	if (startDate) conditions.push(gte(userActivity.createdAt, startDate));
	if (track !== "all") conditions.push(eq(userActivity.track, track));

	const results = await db
		.select({
			userId: userActivity.userId,
			xp: sql<number>`sum(${userActivity.xpEarned})::int`,
			username: user.name,
			walletAddress: user.walletAddress,
			avatar: user.avatarSeed,
		})
		.from(userActivity)
		.innerJoin(user, eq(userActivity.userId, user.id))
		.where(and(...conditions))
		.groupBy(
			userActivity.userId,
			user.name,
			user.walletAddress,
			user.avatarSeed,
		)
		.orderBy(desc(sql`sum(${userActivity.xpEarned})`))
		.limit(50);

	return results.map((r, i) => ({
		rank: i + 1,
		userId: r.userId,
		username: r.username,
		walletAddress: r.walletAddress || "Unknown",
		avatar: r.avatar || "bi-person-fill",
		xp: r.xp,
		level: Math.max(1, Math.floor(Math.sqrt(r.xp / 100))),
		streak: 0,
	}));
}

/**
 * Calculates the standing of a specific user within the global rankings.
 *
 * @param userId - The unique identifier of the user.
 * @returns The user's standing or null if not found.
 */
export async function getUserStanding(
	userId: string,
): Promise<UserStanding | null> {
	if (!userId) return null;

	// Note: Percentile and rank calculations are more complex in SQL,
	// for MVP we calculate based on global rank
	const users = await db
		.select({ id: user.id, xp: user.totalXp })
		.from(user)
		.orderBy(desc(user.totalXp));

	const userRank = users.findIndex((u) => u.id === userId) + 1;
	if (userRank === 0) return null;

	const totalUsers = users.length;
	const percentile = ((totalUsers - userRank) / totalUsers) * 100;
	const topPercentile = 100 - percentile;

	const topUserXp = users[0]?.xp || 0;
	const userXp = users[userRank - 1]?.xp || 0;

	return {
		globalRank: userRank,
		percentile: `TOP ${Math.max(1, Math.ceil(topPercentile))}%`,
		xpToFirst: topUserXp - userXp,
		rewardsEligible: userRank <= 100,
		xp: userXp,
	};
}

/**
 * Retrieves the current global rank of a user without full standing data.
 *
 * @param userId - The unique identifier of the user.
 * @returns The rank number (1-indexed).
 */
export async function getCurrentUserRank(userId: string): Promise<number> {
	if (!userId) return 0;
	const users = await db
		.select({ id: user.id })
		.from(user)
		.orderBy(desc(user.totalXp));

	return users.findIndex((u) => u.id === userId) + 1;
}

/**
 * Synchronizes a user's database XP and level with their real on-chain XP balance.
 * Looks up the user's wallet from the DB — the on-chain wallet is the source of truth.
 *
 * @param userId - The database ID of the user.
 * @param walletAddress - Optional override. If not provided, looked up from user record.
 * @returns The synchronized XP balance or null on failure.
 */
export async function syncUserXp(userId: string, walletAddress?: string) {
	if (!userId) return null;

	try {
		// Look up wallet from DB if not provided — DB wallet is the source of truth
		let address = walletAddress;
		if (!address) {
			const userRecord = await db
				.select({ walletAddress: user.walletAddress })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			address = userRecord[0]?.walletAddress ?? undefined;
		}

		if (!address) return null;

		// Fetch XP from on-chain wallet — this is the source of truth
		const onchainXp = await onchainQueryService.getXpBalance(address);
		const level = Math.max(1, Math.floor(Math.sqrt(onchainXp / 100)));

		// Push on-chain XP to DB so leaderboard reads it from there
		await db
			.update(user)
			.set({
				totalXp: onchainXp,
				level: level,
			})
			.where(eq(user.id, userId));

		return onchainXp;
	} catch (error) {
		console.error(`Failed to sync XP for user ${userId}:`, error);
		return null;
	}
}
