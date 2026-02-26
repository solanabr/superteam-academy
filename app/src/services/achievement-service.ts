import type { Achievement } from "@/types";

export interface AchievementService {
  getAchievements(userId: string): Promise<Achievement[]>;
  getEarnedAchievements(userId: string): Promise<Achievement[]>;
  checkAndAward(userId: string): Promise<Achievement[]>;
}
