import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { admin_users_query_schema } from "@/lib/validators/admin";
import { db } from "@/lib/db";
import { users, user_streaks, wallets, xp_snapshots } from "@/lib/db/schema";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const parsed = admin_users_query_schema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) return json_error("Invalid query", 400);

  const { q, role, limit, offset } = parsed.data;

  const conditions = [];
  if (q) conditions.push(ilike(users.email, `%${q}%`));
  if (role) conditions.push(eq(users.role, role));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const count_result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where ?? sql`true`);
  const total_count = Number(count_result[0]?.count ?? 0);

  const base_rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      joined_at: users.created_at,
    })
    .from(users)
    .where(where ?? sql`true`)
    .orderBy(users.created_at)
    .limit(limit)
    .offset(offset);

  const user_ids = base_rows.map((row) => row.id);
  if (user_ids.length === 0) {
    return json_ok({ users: [], total: 0 });
  }

  const wallets_rows = await db
    .select({
      user_id: wallets.user_id,
      public_key: wallets.public_key,
    })
    .from(wallets)
    .where(inArray(wallets.user_id, user_ids));

  const streak_rows = await db
    .select({
      user_id: user_streaks.user_id,
      current_streak_days: user_streaks.current_streak_days,
    })
    .from(user_streaks)
    .where(inArray(user_streaks.user_id, user_ids));

  const xp_rows = await db
    .select({
      user_id: xp_snapshots.user_id,
      total_xp: xp_snapshots.total_xp,
      snapshot_at: xp_snapshots.snapshot_at,
    })
    .from(xp_snapshots)
    .where(inArray(xp_snapshots.user_id, user_ids));

  const wallet_by_user = new Map<string, string>();
  for (const row of wallets_rows) {
    if (!wallet_by_user.has(row.user_id)) {
      wallet_by_user.set(row.user_id, row.public_key);
    }
  }

  const streak_by_user = new Map<string, number>();
  for (const row of streak_rows) {
    streak_by_user.set(row.user_id, row.current_streak_days);
  }

  const xp_by_user = new Map<string, number>();
  const latest_snapshot_by_user = new Map<string, Date>();
  for (const row of xp_rows) {
    const existing = latest_snapshot_by_user.get(row.user_id);
    if (!existing || row.snapshot_at > existing) {
      latest_snapshot_by_user.set(row.user_id, row.snapshot_at);
      xp_by_user.set(row.user_id, row.total_xp);
    }
  }

  const users_payload = base_rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    wallet_public_key: wallet_by_user.get(row.id) ?? null,
    total_xp: xp_by_user.get(row.id) ?? 0,
    current_streak_days: streak_by_user.get(row.id) ?? 0,
    joined_at: row.joined_at.toISOString(),
  }));

  return json_ok({ users: users_payload, total: total_count });
}

