import { desc, isNull } from "drizzle-orm";
import { json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";

export async function GET(): Promise<Response> {
  const rows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp_reward: challenges.xp_reward,
      created_at: challenges.created_at,
      deleted_at: challenges.deleted_at,
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

