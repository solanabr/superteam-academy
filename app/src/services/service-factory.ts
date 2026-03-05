import { Connection, PublicKey } from "@solana/web3.js";

import type {
  XpService,
  CredentialService,
  LeaderboardService,
  ProgressService,
  StreakService,
  AchievementService,
  ActivityService,
} from "./interfaces";

import { LocalXpService } from "./xp.service";
import { LocalCredentialService } from "./credential.service";
import { LocalLeaderboardService } from "./leaderboard.service";
import { LocalProgressService } from "./progress.service";
import { LocalStreakService } from "./streak.service";
import { LocalAchievementService } from "./achievement.service";
import { LocalActivityService } from "./activity.service";

import { DevnetXpService } from "./onchain/xp.service";
import { DevnetCredentialService } from "./onchain/credential.service";
import { DevnetLeaderboardService } from "./onchain/leaderboard.service";
import { DevnetProgressService } from "./onchain/progress.service";

interface Services {
  xpService: XpService;
  credentialService: CredentialService;
  leaderboardService: LeaderboardService;
  progressService: ProgressService;
  streakService: StreakService;
  achievementService: AchievementService;
  activityService: ActivityService;
}

/**
 * Creates service instances based on environment configuration.
 *
 * When `HELIUS_RPC_URL` is set → Devnet services for XP, credentials,
 * progress, and leaderboard. Otherwise → all Local stubs.
 *
 * Streak, achievement, and activity always use Local (frontend-only per spec).
 */
export function createServices(): Services {
  const heliusUrl = process.env.HELIUS_RPC_URL;
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  const xpMintStr = process.env.NEXT_PUBLIC_XP_MINT;
  const useOnchain =
    typeof window !== "undefined" && !!heliusUrl && !!rpcUrl && !!xpMintStr;

  // Always local
  const streakService = new LocalStreakService();
  const achievementService = new LocalAchievementService();
  const activityService = new LocalActivityService();

  if (!useOnchain) {
    return {
      xpService: new LocalXpService(),
      credentialService: new LocalCredentialService(),
      leaderboardService: new LocalLeaderboardService(),
      progressService: new LocalProgressService(),
      streakService,
      achievementService,
      activityService,
    };
  }

  const connection = new Connection(rpcUrl);
  const xpMint = new PublicKey(xpMintStr);

  return {
    xpService: new LocalXpService(),
    credentialService: new DevnetCredentialService(heliusUrl),
    leaderboardService: new LocalLeaderboardService(),
    progressService: new LocalProgressService(),
    streakService,
    achievementService,
    activityService,
  };
}
