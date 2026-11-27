import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** An event as everything but the admin screen sees it: no code. */
export interface PublicEvent {
  id: string;
  achievementId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  xpReward: number;
  startsAt: string;
  endsAt: string;
}

/** The event behind an on-chain achievement id, or null. */
export async function getEventByAchievementId(
  achievementId: string
): Promise<PublicEvent | null> {
  const { data } = await createAdminClient()
    .from("events")
    .select(
      "id, achievement_id, name, description, image_url, xp_reward, starts_at, ends_at"
    )
    .eq("achievement_id", achievementId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    achievementId: data.achievement_id,
    name: data.name,
    description: data.description,
    imageUrl: data.image_url,
    xpReward: data.xp_reward,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
  };
}
