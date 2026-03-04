import { sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { xp_snapshots } from "@/lib/db/schema";

export async function GET(_request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const [count_row] = await db
    .select({ count: sql<number>`count(distinct ${xp_snapshots.user_id})` })
    .from(xp_snapshots);

  const [latest] = await db
    .select({ snapshot_at: sql<Date>`max(${xp_snapshots.snapshot_at})` })
    .from(xp_snapshots);

  return json_ok({
    last_refresh_at: latest?.snapshot_at ? new Date(latest.snapshot_at).toISOString() : null,
    total_indexed: Number(count_row?.count ?? 0),
  });
}
