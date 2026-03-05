/**
 * @fileoverview Shared constants and types for the leaderboard system.
 * These are safe to import in both client and server environments.
 */

/**
 * Supported time periods for leaderboard filtering.
 */
export type LeaderboardPeriod = "weekly" | "monthly" | "all-time";

/**
 * Official Metaplex Core Collection addresses for each learning track.
 * Maps numeric track IDs from the Solana program to their on-chain collection mints.
 */
export const TRACK_COLLECTIONS = {
	1: "GxHJGC7rW6s3giJPSNh7DMnGutyrEZi4T4drjgTJwzFe", // Rust
	2: "4f6JCjJryBoqF5EFBASZmnqwBqaf4YyDPNZsayCdC1mJ", // Anchor
	3: "HevRVfHWYeiUKaeZ9sGhxjtA93nCp4MKuvV1wU6odFzE", // DeFi
	4: "3JkhKemGbEZireyyvjAZmyzfBJoP2fZTrprdugwGp54e", // Security
	5: "484TktXzNhKpWjSLy6U5cYd5aUouic2k6mQjL1t1gPgr", // Frontend
} as const;

export type TrackId = keyof typeof TRACK_COLLECTIONS;

/**
 * Learning tracks available for leaderboard filtering.
 * Uses 'all' or specific collection mint addresses.
 */
export type LeaderboardTrack = "all" | (typeof TRACK_COLLECTIONS)[TrackId];

/**
 * Represents a single entry in the leaderboard rankings.
 */
export interface LeaderboardEntry {
	rank: number;
	userId: string;
	username: string;
	walletAddress: string;
	avatar: string; // Bootstrap icon name
	xp: number;
	level: number;
	streak: number;
	isCurrentUser?: boolean;
}

/**
 * Filter criteria for leaderboard queries.
 */
export interface LeaderboardFilter {
	period: LeaderboardPeriod;
	track: LeaderboardTrack;
}

/**
 * Summary of a specific user's position relative to the entire leaderboard.
 */
export interface UserStanding {
	globalRank: number;
	percentile: string; // e.g., "TOP 1%"
	xpToFirst: number;
	rewardsEligible: boolean;
	xp?: number;
}
