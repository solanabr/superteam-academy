import type { StreakData, WalletAddress } from "./models";

export interface StreakService {
  getStreak(wallet: WalletAddress): Promise<StreakData>;
  recordActivity(wallet: WalletAddress, date?: string): Promise<StreakData>;
  getMilestones(): Promise<number[]>;
}

class StubStreakService implements StreakService {
  async getStreak(): Promise<StreakData> {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakCalendar: []
    };
  }

  async recordActivity(wallet: WalletAddress, date?: string): Promise<StreakData> {
    void wallet;
    void date;
    return this.getStreak();
  }

  async getMilestones(): Promise<number[]> {
    return [7, 30, 100];
  }
}

export const streakService: StreakService = new StubStreakService();

