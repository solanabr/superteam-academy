import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  achievement_awards,
  achievements,
  admin_logs,
  users,
  wallets,
} from "@/lib/db/schema";
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


