import type { LeaderboardEntry, LeaderboardTimeframe } from "./learning-progress";

const MOCK_WALLETS = [
    "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "5ZWj7a1f8tWkjBESHKgrLznVFE2BHNR1CgsR3Zf1Yyb5",
    "3GhQtBv8yLrpnEhYqzVPVGcEJzLh7m4iW8HnzBSGQArv",
    "BxnCaEuWqR7GJSxRhNUDs3VnfzZSBaWwZBkFm6vN7zhQ",
    "FjrCKmjhCsK8F5jq9oGwWfLEw1rVJupzMafWqHDiBxPN",
    "4smhN2vbZF3f2uVL8uqe1p8TNQGmzD5sRz8nwPTW4vBZ",
    "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    "2fmz8SuNVyxEP6QwKQs6LNaT2ATszySPEJdhCDesVHo4",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
];

export function getMockLeaderboard(
    timeframe: LeaderboardTimeframe
): LeaderboardEntry[] {
    const multiplier =
        timeframe === "weekly" ? 0.2 : timeframe === "monthly" ? 0.5 : 1;

    return MOCK_WALLETS.map((wallet, i) => ({
        rank: i + 1,
        wallet,
        xp: Math.round((10000 - i * 900) * multiplier),
    }));
}

export function getMockStreakData() {
    return {
        current: 5,
        history: [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0],
    };
}
