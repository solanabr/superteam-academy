import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { admin_logs, challenges } from "@/lib/db/schema";
import { get_challenge_by_id, is_sanity_configured } from "@/lib/services/course-service";
import { patch_challenge_body_schema } from "@/lib/validators/challenge";

type Params = Promise<{ id: string }>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: { params: Params }): Promise<Response> {
  const { id } = await params;

  if (is_sanity_configured()) {
    const sanity_challenge = await get_challenge_by_id(id, false);
    if (sanity_challenge) {
      const payload = {
        id: sanity_challenge.id,
        title: sanity_challenge.title,
        description: sanity_challenge.description,
        difficulty: sanity_challenge.difficulty,
        starter_code: sanity_challenge.starter_code,
        language: sanity_challenge.language,
        test_cases: sanity_challenge.test_cases,
        xp_reward: sanity_challenge.xp_reward,
        time_estimate_minutes: sanity_challenge.time_estimate_minutes,
        track_association: sanity_challenge.track_association,
        created_at: sanity_challenge.created_at ?? null,
        updated_at: sanity_challenge.updated_at ?? null,
      };
      return json_ok(payload);
    }
  }

  if (UUID_REGEX.test(id)) {
    const rows = await db
      .select({
        id: challenges.id,
        external_id: challenges.external_id,
        title: challenges.title,
        description: challenges.description,
        difficulty: challenges.difficulty,
        starter_code: challenges.starter_code,
        language: challenges.language,
        test_cases: challenges.test_cases,
        xp_reward: challenges.xp_reward,
        time_estimate_minutes: challenges.time_estimate_minutes,
        track_association: challenges.track_association,
        deleted_at: challenges.deleted_at,
        created_at: challenges.created_at,
        updated_at: challenges.updated_at,
      })
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    const challenge = rows[0];
    if (challenge && !challenge.deleted_at) {
      const payload = {
        ...challenge,
        deleted_at: null,
        created_at:
          challenge.created_at instanceof Date
            ? challenge.created_at.toISOString()
            : new Date(challenge.created_at).toISOString(),
        updated_at:
          challenge.updated_at instanceof Date
            ? challenge.updated_at.toISOString()
            : new Date(challenge.updated_at).toISOString(),
      };
      return json_ok(payload);
    }
  }

  return json_error("Challenge not found", 404);
}

export async function PATCH(request: NextRequest, { params }: { params: Params }): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const { id } = await params;
  const body_unknown = await request.json();
  const parsed = patch_challenge_body_schema.safeParse(body_unknown);
  if (!parsed.success) return json_error("Invalid body", 400);

  const body = parsed.data;

  const existing_rows = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  const existing = existing_rows[0];
  if (!existing) {
    return json_error("Challenge not found", 404);
  }

  const now = new Date();

  await db
    .update(challenges)
    .set({
      external_id: body.external_id ?? existing.external_id,
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      difficulty: body.difficulty ?? existing.difficulty,
      starter_code: body.starter_code ?? existing.starter_code,
      language: body.language ?? existing.language,
      test_cases: body.test_cases ?? existing.test_cases,
      xp_reward: body.xp_reward ?? existing.xp_reward,
      time_estimate_minutes: body.time_estimate_minutes ?? existing.time_estimate_minutes,
      track_association: body.track_association ?? existing.track_association,
      updated_at: now,
    })
    .where(eq(challenges.id, id));

  await db.insert(admin_logs).values({
    admin_id: result.session.sub,
    action: "challenge_update",
    target_type: "challenge",
    target_id: id,
    metadata: {
      title: body.title ?? existing.title,
      difficulty: body.difficulty ?? existing.difficulty,
      xp_reward: body.xp_reward ?? existing.xp_reward,
      language: body.language ?? existing.language,
      track_association: body.track_association ?? existing.track_association,
    },
  });

  return json_ok({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const { id } = await params;

  const existing_rows = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  const existing = existing_rows[0];
  if (!existing) {
    return json_error("Challenge not found", 404);
  }

  const now = new Date();

  if (!existing.deleted_at) {
    await db
      .update(challenges)
      .set({
        deleted_at: now,
        updated_at: now,
      })
      .where(eq(challenges.id, id));

    await db.insert(admin_logs).values({
      admin_id: result.session.sub,
      action: "challenge_soft_delete",
      target_type: "challenge",
      target_id: id,
      metadata: {
        title: existing.title,
      },
    });
  }

  return json_ok({ ok: true });
}

