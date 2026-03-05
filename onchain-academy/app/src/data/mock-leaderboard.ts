import type { LeaderboardEntry, Timeframe } from "@/types/domain";

// User's wallet visible in the screenshot: 6xZj...Rk3J
const USER_WALLET = "6xZjMqBs9PnTrKaVcHeYiGfWkDqNoEiLdBzFkApJvRk3J";

const BASE_ENTRIES: Omit<LeaderboardEntry, "timeframe">[] = [
  {
    rank: 1,
    walletAddress: "9HqtpnEtT2RmKzaPVnkd8wJqXcYbVhLsDfGjApNoCrWX",
    displayName: "sol_wizard",
    xp: 18_420,
    level: 13,
    streak: 42,
  },
  {
    rank: 2,
    walletAddress: "Bm4KtpWdT5SqLzaRVnke9wJrYcZbUhLsMfHjBpMoCsWY",
    displayName: "anchor_dev",
    xp: 14_850,
    level: 12,
    streak: 30,
  },
  {
    rank: 3,
    walletAddress: "DpKvLmCnA3RsQzaXVole7wJtZcAbThLsNgIjDqPoEtVZ",
    displayName: "rustacean",
    xp: 11_200,
    level: 10,
    streak: 21,
  },
  {
    rank: 4,
    walletAddress: USER_WALLET,
    displayName: "superteam_br",
    xp: 8_750,
    level: 9,
    streak: 14,
  },
  {
    rank: 5,
    walletAddress: "FqNwOmBpE4TuPzaYVpmf8wKuAcBbViLsTgJkEqRpFuWA",
    displayName: "token22_fan",
    xp: 6_300,
    level: 7,
    streak: 9,
  },
  {
    rank: 6,
    walletAddress: "GrOpPnCqF5UvQzaZWqng9wLvBdCcWjMtUhKlFrSpGvXB",
    displayName: "pdamaster",
    xp: 5_100,
    level: 7,
    streak: 7,
  },
  {
    rank: 7,
    walletAddress: "HsQqRoDrG6VwRzaAXroh0wMwCeEdXkNuViLmGsToHwYC",
    displayName: "cpi_nerd",
    xp: 4_200,
    level: 6,
    streak: 5,
  },
  {
    rank: 8,
    walletAddress: "ItRrSpEsH7WxSzaBYspi1wNxDfFeYlOvWjMnHtUpIxZD",
    displayName: "metaplex_fan",
    xp: 3_500,
    level: 5,
    streak: 4,
  },
  {
    rank: 9,
    walletAddress: "JuSsTqFtI8XySzaCZtqj2wOyEgGfZmPwXkNoIuVqJyAE",
    displayName: "defi_builder",
    xp: 2_800,
    level: 5,
    streak: 3,
  },
  {
    rank: 10,
    walletAddress: "KvTtUrGuJ9YzTzaDaurl3wPzFhHgAnQxYlOpJvWrKzBF",
    displayName: "nft_wizard",
    xp: 2_100,
    level: 4,
    streak: 2,
  },
];

export function getMockLeaderboard(timeframe: Timeframe): LeaderboardEntry[] {
  // Weekly has fewer XP, monthly is mid, all-time is full
  const multiplier =
    timeframe === "weekly" ? 0.15 : timeframe === "monthly" ? 0.45 : 1;
  return BASE_ENTRIES.map((e) => ({
    ...e,
    xp: Math.round(e.xp * multiplier),
    timeframe,
  }));
}

export { USER_WALLET as MOCK_USER_WALLET };
