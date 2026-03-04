import { and, eq, ilike, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { admin_logs_query_schema } from "@/lib/validators/admin";
import { db } from "@/lib/db";
import { admin_logs, users } from "@/lib/db/schema";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const parsed = admin_logs_query_schema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    actor: url.searchParams.get("actor") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
  });
  if (!parsed.success) return json_error("Invalid query", 400);

  const { limit, offset, actor, action } = parsed.data;

  const conditions = [];
  if (actor) conditions.push(ilike(users.email, `%${actor}%`));
  if (action) conditions.push(eq(admin_logs.action, action));
  const where_clause = conditions.length > 0 ? and(...conditions) : undefined;

  const count_result = await db
    .select({ count: sql<number>`count(${admin_logs.id})` })
    .from(admin_logs)
    .leftJoin(users, eq(users.id, admin_logs.admin_id))
    .where(where_clause);
  const total_count = Number(count_result[0]?.count ?? 0);

  const rows = await db
    .select({
      id: admin_logs.id,
      action: admin_logs.action,
      target_type: admin_logs.target_type,
      target_id: admin_logs.target_id,
      metadata: admin_logs.metadata,
      created_at: admin_logs.created_at,
      actor_email: users.email,
    })
    .from(admin_logs)
    .leftJoin(users, eq(users.id, admin_logs.admin_id))
    .where(where_clause)
    .orderBy(sql`${admin_logs.created_at} desc`)
    .limit(limit)
    .offset(offset);

  const logs_payload = rows.map((row) => ({
    id: row.id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: row.metadata,
    created_at: row.created_at.toISOString(),
    actor_email: row.actor_email ?? null,
  }));

  return json_ok({ logs: logs_payload, total: total_count });
}

