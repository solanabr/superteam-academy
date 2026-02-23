import { mockAchievements } from "@/lib/data/mock-courses";
import type { Achievement } from "@/types";

export interface AchievementService {
  listAchievements(userId: string): Promise<Achievement[]>;
  claimAchievement(userId: string, achievementId: string): Promise<Achievement | null>;
}

class LocalAchievementService implements AchievementService {
  async listAchievements(userId: string): Promise<Achievement[]> {
    void userId;
    return mockAchievements;
  }

  async claimAchievement(
    userId: string,
    achievementId: string,
  ): Promise<Achievement | null> {
    void userId;
    const achievement = mockAchievements.find((item) => item.id === achievementId);
    if (!achievement) {
      return null;
    }
    return {
      ...achievement,
      unlocked: true,
    };
  }
}

export const achievementService: AchievementService = new LocalAchievementService();
