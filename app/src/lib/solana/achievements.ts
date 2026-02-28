import { Connection, PublicKey } from '@solana/web3.js';
import { achievementReceiptPda } from './pda';

/** Achievement categories matching the Sanity CMS schema. */
export type AchievementCategory = 'learning' | 'streak' | 'challenge' | 'social' | 'special';

/** Off-chain achievement definition — sourced from Sanity CMS. */
export interface AchievementDefinition {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  condition: {
    type: string;
    value: number;
  };
}

/** User-facing achievement status — earned flag + optional on-chain data. */
export interface UserAchievement {
  achievementId: string;
  earned: boolean;
  earnedAt?: number;
  assetId?: string;
}

/**
 * Check whether a specific achievement receipt PDA exists on-chain.
 * Returns true if the receipt account has been initialized (achievement awarded).
 */
export async function hasAchievement(
  connection: Connection,
  achievementId: string,
  recipient: PublicKey,
): Promise<boolean> {
  const [receiptPda] = achievementReceiptPda(achievementId, recipient);
  const accountInfo = await connection.getAccountInfo(receiptPda);
  return accountInfo !== null;
}

/**
 * Batch-fetch achievement receipt existence for a user across all known achievement IDs.
 * Uses getMultipleAccountsInfo for a single RPC round-trip.
 */
export async function getUserAchievements(
  connection: Connection,
  recipient: PublicKey,
  knownAchievementIds: string[],
): Promise<UserAchievement[]> {
  const receiptPdas = knownAchievementIds.map((id) => {
    const [pda] = achievementReceiptPda(id, recipient);
    return pda;
  });

  const accountInfos = await connection.getMultipleAccountsInfo(receiptPdas);

  const results: UserAchievement[] = [];
  for (let i = 0; i < knownAchievementIds.length; i++) {
    const id = knownAchievementIds[i]!;
    const info = accountInfos[i];
    results.push({
      achievementId: id,
      earned: info !== null,
      // Deserialization of earnedAt and assetId pending IDL integration
    });
  }

  return results;
}

/** Context fields available for frontend achievement condition evaluation. */
export interface AchievementContext {
  coursesCompleted?: number;
  streakDays?: number;
  challengesCompleted?: number;
  forumAnswersAccepted?: number;
  totalXp?: number;
  lessonsCompleted?: number;
}

/**
 * Evaluate whether an achievement's unlock condition is satisfied by the given context.
 * Pure function — no network calls, safe for frontend evaluation.
 */
export function evaluateAchievementCondition(
  condition: { type: string; value: number },
  context: AchievementContext,
): boolean {
  switch (condition.type) {
    case 'courses_completed':
      return (context.coursesCompleted ?? 0) >= condition.value;
    case 'streak_days':
      return (context.streakDays ?? 0) >= condition.value;
    case 'challenges_completed':
      return (context.challengesCompleted ?? 0) >= condition.value;
    case 'forum_answers':
      return (context.forumAnswersAccepted ?? 0) >= condition.value;
    case 'total_xp':
      return (context.totalXp ?? 0) >= condition.value;
    case 'lessons_completed':
      return (context.lessonsCompleted ?? 0) >= condition.value;
    default:
      return false;
  }
}
