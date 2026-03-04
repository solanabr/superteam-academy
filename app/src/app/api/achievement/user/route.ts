import { and, eq } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_success } from "@/lib/api/response";
import { db } from "@/lib/db";
import { achievement_awards, achievements } from "@/lib/db/schema";

export async function GET(): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const rows = await db
    .select({
      achievement_id: achievements.achievement_id,
      name: achievements.name,
      metadata_uri: achievements.metadata_uri,
      image_url: achievements.image_url,
      xp_reward: achievements.xp_reward,
      awarded_at: achievement_awards.awarded_at,
      tx_signature: achievement_awards.tx_signature,
    })
    .from(achievement_awards)
    .innerJoin(
      achievements,
      and(eq(achievement_awards.achievement_id, achievements.id), eq(achievement_awards.user_id, session.sub)),
    );

  const achievements_payload = rows.map((r) => ({
    ...r,
    image_url: r.image_url ?? undefined,
  }));

  return api_success({ achievements: achievements_payload }, "User achievements fetched", 200);
}
