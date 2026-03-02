import type { LeaderboardEntry } from "./types";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IXpService {
  getXpBalance(wallet: string): Promise<number>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(300 + Math.random() * 500);
}

/** Derive a display level from raw XP. Matches a simple square-root curve. */
function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_LEADERBOARD: Omit<LeaderboardEntry, "rank">[] = [
  { wallet: "WALLet111111111111111111111111111111111111", xp: 14200, level: xpToLevel(14200) },
  { wallet: "WALLet222222222222222222222222222222222222", xp: 11750, level: xpToLevel(11750) },
  { wallet: "WALLet333333333333333333333333333333333333", xp: 9800, level: xpToLevel(9800) },
  { wallet: "WALLet444444444444444444444444444444444444", xp: 8600, level: xpToLevel(8600) },
  { wallet: "WALLet555555555555555555555555555555555555", xp: 7350, level: xpToLevel(7350) },
  { wallet: "WALLet666666666666666666666666666666666666", xp: 6100, level: xpToLevel(6100) },
  { wallet: "WALLet777777777777777777777777777777777777", xp: 5250, level: xpToLevel(5250) },
  { wallet: "WALLet888888888888888888888888888888888888", xp: 4400, level: xpToLevel(4400) },
  { wallet: "WALLet999999999999999999999999999999999999", xp: 3600, level: xpToLevel(3600) },
  { wallet: "WALLetAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", xp: 2800, level: xpToLevel(2800) },
];

// ---------------------------------------------------------------------------
// Stub implementation
// ---------------------------------------------------------------------------

export class StubXpService implements IXpService {
  async getXpBalance(_wallet: string): Promise<number> {
    await randomDelay();
    // Return a deterministic-looking balance based on the stub enrollments:
    // solana-101 completed (8 lessons * 100 XP + 50% bonus = 1200 XP)
    // anchor-fundamentals in progress (4 lessons * 150 XP = 600 XP)
    return 1800;
  }

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    await randomDelay();
    return MOCK_LEADERBOARD.slice(0, limit).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }
}
