/**
 * Service layer barrel export.
 *
 * When HELIUS_RPC_URL is configured → Devnet on-chain services.
 * Otherwise → localStorage stubs (zero change from before).
 *
 * Usage:
 *   import { progressService, xpService } from "@/services";
 *   const progress = await progressService.getProgress(wallet, courseId);
 */

export { LocalProgressService } from "./progress.service";
export { LocalXpService, addXp, getLocalXp } from "./xp.service";
export { LocalStreakService } from "./streak.service";
export { LocalCredentialService } from "./credential.service";
export { LocalLeaderboardService } from "./leaderboard.service";
export { LocalAchievementService } from "./achievement.service";
export { LocalActivityService } from "./activity.service";

// Re-export interfaces
export type {
  ProgressService,
  XpService,
  StreakService,
  CredentialService,
  LeaderboardService,
  AchievementService,
  ActivityService,
  AuthService,
  CourseContentService,
} from "./interfaces";

// Singleton instances via factory
import { createServices } from "./service-factory";

const services = createServices();

export const progressService = services.progressService;
export const xpService = services.xpService;
export const streakService = services.streakService;
export const credentialService = services.credentialService;
export const leaderboardService = services.leaderboardService;
export const achievementService = services.achievementService;
export const activityService = services.activityService;
