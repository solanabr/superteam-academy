import { NextRequest } from "next/server";
import { require_admin_role } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { refresh_leaderboard_from_chain } from "@/lib/services/leaderboard-service";
import { check_rate_limit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_admin_role();
  if (result.response) return result.response;

  const rate_limit = await check_rate_limit({
    key: `admin_leaderboard_refresh:${result.session.sub}`,
    window_ms: 10 * 60 * 1000,
    max: 1,
  });

  if (!rate_limit.allowed) {
    return api_error("Too many requests", 429);
  }

  try {
    await refresh_leaderboard_from_chain();
    return api_success({ ok: true }, "Leaderboard refresh queued", 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to refresh leaderboard";
    return api_error(message, 500);
  }
}

