/**
 * @fileoverview Server actions for the leaderboard and user rankings.
 */
"use server";

import type {
	LeaderboardPeriod,
	LeaderboardTrack,
} from "@/lib/constants/leaderboard";
import { getLeaderboard, syncUserXp } from "@/lib/data/leaderboard";

/**
 * Server action to fetch leaderboard entries based on period and track filters.
 */
export async function fetchFilteredLeaderboard(
	period: LeaderboardPeriod,
	track: LeaderboardTrack,
) {
	return await getLeaderboard(period, track);
}

/**
 * Server action to synchronize user XP balance.
 */
export async function syncUserXpAction(userId: string, walletAddress?: string) {
	return await syncUserXp(userId, walletAddress);
}
