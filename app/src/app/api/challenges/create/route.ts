import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { json_error, json_ok } from "@/lib/api/response";
import { db } from "@/lib/db";
import { admin_logs, challenges } from "@/lib/db/schema";
import { create_challenge_body_schema } from "@/lib/validators/challenge";

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const body_unknown = await request.json();
  const parsed = create_challenge_body_schema.safeParse(body_unknown);
  if (!parsed.success) return json_error("Invalid body", 400);

  const body = parsed.data;

  try {
    const now = new Date();

    const inserted = await db
      .insert(challenges)
      .values({
        external_id: body.external_id,
        title: body.title,
        description: body.description,
        difficulty: body.difficulty,
        starter_code: body.starter_code,
        language: body.language,
        test_cases: body.test_cases ?? null,
        xp_reward: body.xp_reward,
        time_estimate_minutes: body.time_estimate_minutes ?? null,
        track_association: body.track_association,
        created_at: now,
        updated_at: now,
      })
      .returning({
        id: challenges.id,
      });

    const created = inserted[0];
    if (!created) {
      return json_error("Failed to create challenge", 500);
    }

    await db.insert(admin_logs).values({
      admin_id: result.session.sub,
      action: "challenge_create",
      target_type: "challenge",
      target_id: created.id,
      metadata: {
        title: body.title,
        difficulty: body.difficulty,
        xp_reward: body.xp_reward,
        language: body.language,
        track_association: body.track_association ?? null,
      },
    });

    return json_ok({ id: created.id });
  } catch {
    return json_error("Failed to create challenge", 500);
  }
}

