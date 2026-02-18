/**
 * Rank System for XP progression
 * Maps XP thresholds to named ranks
 */

export type Rank = {
    name: string;
    minXp: number;
    nextRank: string | null;
    nextXp: number | null;
    color: string; // Tailwind color class
};

export const RANKS: Rank[] = [
    {
        name: "Newbie",
        minXp: 0,
        nextRank: "Squire",
        nextXp: 1000,
        color: "text-gray-400",
    },
    {
        name: "Squire",
        minXp: 1000,
        nextRank: "Knight",
        nextXp: 5000,
        color: "text-blue-400",
    },
    {
        name: "Knight",
        minXp: 5000,
        nextRank: "Champion",
        nextXp: 15000,
        color: "text-purple-400",
    },
    {
        name: "Champion",
        minXp: 15000,
        nextRank: "Master",
        nextXp: 50000,
        color: "text-yellow-400",
    },
    {
        name: "Master",
        minXp: 50000,
        nextRank: "Legend",
        nextXp: 100000,
        color: "text-orange-400",
    },
    {
        name: "Legend",
        minXp: 100000,
        nextRank: null,
        nextXp: null,
        color: "text-solana",
    },
];

/**
 * Get rank information from XP
 */
export function getRankFromXp(xp: number): Rank {
    // Find the highest rank where user has enough XP
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXp) {
            return RANKS[i];
        }
    }
    return RANKS[0]; // Default to Newbie
}

/**
 * Get level from XP (numeric level for calculations)
 */
export function getLevelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Get XP progress to next rank (0-1)
 */
export function getRankProgress(xp: number): number {
    const rank = getRankFromXp(xp);
    if (!rank.nextXp) return 1; // Max rank

    const currentRankXp = xp - rank.minXp;
    const xpToNextRank = rank.nextXp - rank.minXp;

    return Math.min(currentRankXp / xpToNextRank, 1);
}
