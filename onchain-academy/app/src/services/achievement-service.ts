import { AchievementService } from "./contracts";

export const achievementService: AchievementService = {
  async claimAchievement(wallet, achievementId) {
    return { receiptId: `${achievementId}-${wallet.slice(0, 6)}-stub` };
  },
  async listAchievements() {
    return ["first-steps", "week-warrior"];
  },
};
