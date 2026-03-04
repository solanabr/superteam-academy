import { desc, isNull } from "drizzle-orm";
import { json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { get_challenges, is_sanity_configured } from "@/lib/services/course-service";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(): Promise<Response> {
  if (is_sanity_configured()) {
    const sanity_list = await get_challenges(false);
    const payload = sanity_list.map((c) => ({
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      xp_reward: c.xp_reward,
      created_at: c.created_at ?? new Date().toISOString(),
    }));
    return json_ok({ challenges: payload });
  }

  const rows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp_reward: challenges.xp_reward,
      created_at: challenges.created_at,
    })
    .from(challenges)
    .where(isNull(challenges.deleted_at))
    .orderBy(desc(challenges.created_at));

  const payload = rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    xp_reward: row.xp_reward,
    created_at: row.created_at.toISOString(),
  }));

  return json_ok({ challenges: payload });
}

