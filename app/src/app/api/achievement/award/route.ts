import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { award_achievement_body_schema } from "@/lib/validators/achievement";
import { award_achievement } from "@/lib/services/achievement-service";
import { check_rate_limit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const rate_limit = await check_rate_limit({
    key: `achievement_award:${result.session.sub}`,
    window_ms: 60 * 1000,
    max: 10,
  });

  if (!rate_limit.allowed) {
    return api_error("Too many requests", 429);
  }

  const body = await request.json();
  const parsed = award_achievement_body_schema.safeParse(body);
  if (!parsed.success) return api_error("Invalid body", 400);

  const { session } = result;
  const { achievement_id, user_id } = parsed.data;

  if (!user_id) {
    return api_error("Target user_id is required", 400);
  }

  const { tx_signature } = await award_achievement({
    admin_id: session.sub,
    user_id,
    achievement_id,
  });

  return api_success(
    { ok: true, tx_signature },
    "Achievement award request accepted",
    200,
  );
}
