import { NextRequest } from "next/server";
import { api_error, api_success } from "@/lib/api/response";
import { leaderboard_query_schema } from "@/lib/validators/leaderboard";
import { get_leaderboard } from "@/lib/services/leaderboard-service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  const timeframe = url.searchParams.get("timeframe") ?? undefined;
  const parsed = leaderboard_query_schema.safeParse({
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    timeframe,
  });
  if (!parsed.success) return api_error("Invalid query", 400);

  const data = await get_leaderboard(parsed.data);
  return api_success(data, "Leaderboard fetched", 200);
}
