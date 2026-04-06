import type {
  AchievementReceiptSummary,
  AchievementTypeSummary,
  WalletAddress
} from "./models";

export interface AchievementService {
  getAchievementTypes(): Promise<AchievementTypeSummary[]>;
  claimAchievement(id: string, wallet: WalletAddress): Promise<void>;
  getUserAchievements(
    wallet: WalletAddress
  ): Promise<AchievementReceiptSummary[]>;
}

class StubAchievementService implements AchievementService {
  async getAchievementTypes(): Promise<AchievementTypeSummary[]> {
    return [];
  }

  async claimAchievement(): Promise<void> {
    return;
  }

  async getUserAchievements(): Promise<AchievementReceiptSummary[]> {
    return [];
  }
}

export const achievementService: AchievementService =
  new StubAchievementService();

