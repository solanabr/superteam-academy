import { getLeaderboard } from "@/lib/api/academy";

export type LeaderboardEntry = {
  rank: number;
  wallet: string;
  xp: number;
};

export const DUMMY_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  { rank: 1, wallet: "7xKXt...9mN2p", xp: 2450 },
  { rank: 2, wallet: "9pL3v...2Qw8r", xp: 2100 },
  { rank: 3, wallet: "4mN8b...5Rx1k", xp: 1890 },
  { rank: 4, wallet: "2cV7h...3Ty4n", xp: 1650 },
  { rank: 5, wallet: "8fDq1...7Wz9j", xp: 1420 },
  { rank: 6, wallet: "5kT9s...1Lm6v", xp: 1280 },
  { rank: 7, wallet: "3nH4r...8Bx2c", xp: 1100 },
  { rank: 8, wallet: "6wP2e...4Jy5d", xp: 950 },
  { rank: 9, wallet: "1gM7a...9Nq3f", xp: 820 },
  { rank: 10, wallet: "0jR5t...2Kp8h", xp: 700 },
];

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  return getLeaderboard();
}
