import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { admin_challenges_query_schema } from "@/lib/validators/admin";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const parsed = admin_challenges_query_schema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    difficulty: url.searchParams.get("difficulty") ?? undefined,
    track: url.searchParams.get("track") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) return json_error("Invalid query", 400);

  const { q, difficulty, track, limit, offset } = parsed.data;

  const conditions = [];
  if (q) conditions.push(ilike(challenges.title, `%${q}%`));
  if (difficulty) conditions.push(eq(challenges.difficulty, difficulty));
  if (track) conditions.push(eq(challenges.track_association, track));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const count_result = await db
    .select({ count: sql<number>`count(*)` })
    .from(challenges)
    .where(where ?? sql`true`);
  const total_count = Number(count_result[0]?.count ?? 0);

  const rows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      difficulty: challenges.difficulty,
      xp_reward: challenges.xp_reward,
      language: challenges.language,
      track_association: challenges.track_association,
      deleted_at: challenges.deleted_at,
      created_at: challenges.created_at,
    })
    .from(challenges)
    .where(where ?? sql`true`)
    .orderBy(desc(challenges.created_at))
    .limit(limit)
    .offset(offset);

  const challenges_payload = rows.map((row) => ({
    id: row.id,
    title: row.title,
    difficulty: row.difficulty,
    xp_reward: row.xp_reward,
    language: row.language,
    track_association: row.track_association,
    deleted_at: row.deleted_at?.toISOString() ?? null,
    created_at: row.created_at.toISOString(),
  }));

  return json_ok({ challenges: challenges_payload, total: total_count });
}
