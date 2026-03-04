import { desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import {
  admin_achievements_query_schema,
  admin_achievement_create_body_schema,
  admin_achievement_update_body_schema,
} from "@/lib/validators/admin";
import { db } from "@/lib/db";
import { achievements, admin_logs } from "@/lib/db/schema";

export async function GET(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const url = new URL(request.url);
  const parsed = admin_achievements_query_schema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) return json_error("Invalid query", 400);

  const { limit, offset } = parsed.data;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(achievements);
  const total = Number(count);

  const rows = await db
    .select({
      id: achievements.id,
      achievement_id: achievements.achievement_id,
      name: achievements.name,
      metadata_uri: achievements.metadata_uri,
      image_url: achievements.image_url,
      xp_reward: achievements.xp_reward,
      is_active: achievements.is_active,
      supply_cap: achievements.supply_cap,
      current_supply: achievements.current_supply,
      criteria_type: achievements.criteria_type,
      criteria_value: achievements.criteria_value,
      created_at: achievements.created_at,
    })
    .from(achievements)
    .orderBy(desc(achievements.created_at))
    .limit(limit)
    .offset(offset);

  const achievements_payload = rows.map((row) => ({
    id: row.id,
    achievement_id: row.achievement_id,
    name: row.name,
    image_url: row.image_url,
    xp_reward: row.xp_reward,
    is_active: row.is_active,
    supply_cap: row.supply_cap,
    current_supply: row.current_supply,
    criteria_type: row.criteria_type,
    criteria_value: row.criteria_value,
    created_at: row.created_at.toISOString(),
  }));

  return json_ok({ achievements: achievements_payload, total });
}

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const body_unknown = await request.json();
  const parsed = admin_achievement_create_body_schema.safeParse(body_unknown);
  if (!parsed.success) return json_error("Invalid body", 400);

  const body = parsed.data;

  const existing = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(eq(achievements.achievement_id, body.achievement_id))
    .limit(1);

  if (existing[0]) {
    return json_error("Achievement already exists", 409);
  }

  const now = new Date();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const metadata_uri =
    body.metadata_uri?.trim() ||
    (baseUrl ? `${baseUrl.replace(/\/$/, "")}/api/metadata/achievements/${encodeURIComponent(body.achievement_id)}` : `achievement:${body.achievement_id}`);

  const inserted = await db
    .insert(achievements)
    .values({
      achievement_id: body.achievement_id,
      name: body.name,
      metadata_uri,
      image_url: (body.image_url?.trim() && body.image_url) ? body.image_url.trim() : null,
      xp_reward: body.xp_reward,
      supply_cap: body.supply_cap ?? null,
      is_active: body.is_active ?? true,
      criteria_type: body.criteria_type ?? null,
      criteria_value: body.criteria_value ?? null,
      created_at: now,
      updated_at: now,
    })
    .returning({
      id: achievements.id,
    });

  const created = inserted[0];
  if (!created) {
    return json_error("Failed to create achievement", 500);
  }

  await db.insert(admin_logs).values({
    admin_id: result.session.sub,
    action: "achievement_create",
    target_type: "achievement",
    target_id: created.id,
    metadata: {
      achievement_id: body.achievement_id,
      name: body.name,
      xp_reward: body.xp_reward,
      supply_cap: body.supply_cap ?? null,
      is_active: body.is_active ?? true,
    },
  });

  return json_ok({ id: created.id });
}

export async function PATCH(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const body_unknown = await request.json();
  const parsed = admin_achievement_update_body_schema.safeParse(body_unknown);
  if (!parsed.success) return json_error("Invalid body", 400);

  const body = parsed.data;

  const rows = await db.select().from(achievements).where(eq(achievements.id, body.id)).limit(1);
  const existing = rows[0];
  if (!existing) {
    return json_error("Achievement not found", 404);
  }

  const now = new Date();

  await db
    .update(achievements)
    .set({
      name: body.name ?? existing.name,
      metadata_uri: body.metadata_uri ?? existing.metadata_uri,
      image_url: body.image_url !== undefined ? (body.image_url?.trim() || null) : existing.image_url,
      xp_reward: body.xp_reward ?? existing.xp_reward,
      supply_cap: body.supply_cap ?? existing.supply_cap,
      is_active: body.is_active ?? existing.is_active,
      criteria_type: body.criteria_type !== undefined ? body.criteria_type : existing.criteria_type,
      criteria_value: body.criteria_value !== undefined ? body.criteria_value : existing.criteria_value,
      updated_at: now,
    })
    .where(eq(achievements.id, body.id));

  await db.insert(admin_logs).values({
    admin_id: result.session.sub,
    action: body.is_active === false ? "achievement_deprecate" : "achievement_update",
    target_type: "achievement",
    target_id: body.id,
    metadata: {
      achievement_id: existing.achievement_id,
      name: body.name ?? existing.name,
      xp_reward: body.xp_reward ?? existing.xp_reward,
      supply_cap: body.supply_cap ?? existing.supply_cap,
      is_active: body.is_active ?? existing.is_active,
    },
  });

  return json_ok({ ok: true });
}

