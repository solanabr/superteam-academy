import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  achievement_awards,
  achievements,
  admin_logs,
  lesson_progress,
  user_challenge_attempts,
  user_streaks,
  users,
  wallets,
} from "@/lib/db/schema";
import type { AchievementCriteriaType } from "@/lib/db/schema";
import { get_xp_balance } from "@/lib/services/blockchain-service";
import { reward_xp_onchain } from "@/lib/services/blockchain-service";

export async function award_achievement(params: {
  admin_id: string;
  user_id: string;
  achievement_id: string;
}): Promise<{ tx_signature: string | null }> {
  const { admin_id, user_id, achievement_id } = params;

  const [user] = await db.select().from(users).where(eq(users.id, user_id)).limit(1);
  if (!user) {
    throw new Error("User not found");
  }

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, user_id))
    .limit(1);
  if (!wallet) {
    throw new Error("User has no linked wallet");
  }

  const [achievement] = await db
    .select()
    .from(achievements)
    .where(eq(achievements.achievement_id, achievement_id))
    .limit(1);

  if (!achievement) {
    throw new Error("Achievement not found");
  }
  if (!achievement.is_active) {
    throw new Error("Achievement is deprecated");
  }
  if (achievement.supply_cap !== null && achievement.current_supply >= achievement.supply_cap) {
    throw new Error("Achievement supply cap reached");
  }

  const [existingAward] = await db
    .select()
    .from(achievement_awards)
    .where(
      and(
        eq(achievement_awards.user_id, user_id),
        eq(achievement_awards.achievement_id, achievement.id),
      ),
    )
    .limit(1);

  if (existingAward) {
    return { tx_signature: existingAward.tx_signature };
  }

  let tx_signature: string | null = null;
  if (achievement.xp_reward > 0) {
    tx_signature = await reward_xp_onchain({
      wallet_public_key: wallet.public_key,
      amount: achievement.xp_reward,
      reason: "achievement",
      challenge_id: achievement.achievement_id,
    });
  }

  await db.insert(achievement_awards).values({
    user_id,
    achievement_id: achievement.id,
    tx_signature,
  });

  await db.insert(admin_logs).values({
    admin_id,
    action: "award_achievement",
    target_type: "user",
    target_id: user_id,
    metadata: {
      achievement_id: achievement.achievement_id,
      achievement_name: achievement.name,
      xp_reward: achievement.xp_reward,
      tx_signature,
    },
  });

  return { tx_signature };
}

/** User stats used to evaluate criteria-based achievements. */
async function get_user_criteria_stats(user_id: string): Promise<{
  total_xp: number;
  lessons_completed: number;
  challenges_completed: number;
  streak_days: number;
}> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.user_id, user_id)).limit(1);
  const total_xp = wallet ? (await get_xp_balance(wallet.public_key))?.total_xp ?? 0 : 0;

  const [lessonsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lesson_progress)
    .where(and(eq(lesson_progress.user_id, user_id), eq(lesson_progress.completed, true)));
  const lessons_completed = Number(lessonsResult?.count ?? 0);

  const [challengesResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user_challenge_attempts)
    .where(and(eq(user_challenge_attempts.user_id, user_id), eq(user_challenge_attempts.passed, true)));
  const challenges_completed = Number(challengesResult?.count ?? 0);

  const [streakRow] = await db
    .select({ current_streak_days: user_streaks.current_streak_days })
    .from(user_streaks)
    .where(eq(user_streaks.user_id, user_id))
    .limit(1);
  const streak_days = streakRow?.current_streak_days ?? 0;

  return { total_xp, lessons_completed, challenges_completed, streak_days };
}

/**
 * Evaluate criteria-based achievements for a user and award any newly met.
 * Call after lesson complete, challenge submit, or streak update.
 */
export async function evaluate_and_award_criteria_achievements(user_id: string): Promise<void> {
  const stats = await get_user_criteria_stats(user_id);

  const rows = await db
    .select()
    .from(achievements)
    .where(
      and(
        eq(achievements.is_active, true),
        sql`${achievements.criteria_type} is not null`,
        sql`${achievements.criteria_value} is not null`,
      ),
    );

  for (const achievement of rows) {
    const criteria_type = achievement.criteria_type as AchievementCriteriaType | null;
    const criteria_value = achievement.criteria_value ?? 0;

    let meets = false;
    if (criteria_type === "xp_reached") meets = stats.total_xp >= criteria_value;
    else if (criteria_type === "lessons_completed") meets = stats.lessons_completed >= criteria_value;
    else if (criteria_type === "challenges_completed") meets = stats.challenges_completed >= criteria_value;
    else if (criteria_type === "streak_days") meets = stats.streak_days >= criteria_value;

    if (!meets) continue;

    const [existing] = await db
      .select()
      .from(achievement_awards)
      .where(
        and(
          eq(achievement_awards.user_id, user_id),
          eq(achievement_awards.achievement_id, achievement.id),
        ),
      )
      .limit(1);

    if (existing) continue;

    try {
      await award_achievement({
        admin_id: user_id,
        user_id,
        achievement_id: achievement.achievement_id,
      });
    } catch {
      // Skip on error (e.g. wallet not linked, supply cap)
    }
  }
}


