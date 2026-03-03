/**
 * Leaderboard Service types.
 */

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string | null;
    wallet: string;
    name: string | null;
    avatar: string | null;
    onchainXp: number;
    offchainXp: number;
    totalXp: number;
    level: number;
}

export type Timeframe = 'all-time' | 'weekly' | 'monthly';

export interface LeaderboardStats {
    totalUsers: number;
    totalXp: number;
    totalCompletions: number;
}

export interface UserRank {
    rank: number;
    onchainXp: number;
    offchainXp: number;
    totalXp: number;
    totalUsers: number;
}
