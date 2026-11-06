import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { runCronJob } from "@/lib/cron/guard";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * How long raw IPs stay in `ai_spend_ledger`. Only today's row is read for the
 * spend cap, so this can go lower without affecting the limiter.
 */
const AI_IP_RETENTION_DAYS = 30;

/**
 * GET /api/cron/ai-ip-retention — removes old IP rows from the AI spend ledger.
 * They hold no account id, so account deletion can't find them; age is the only
 * way they go. Runs daily (`apps/web/vercel.json`) and is safe to repeat.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return runCronJob("ai-ip-retention", req.headers, async () => {
    const { data, error } = await createAdminClient().rpc(
      "purge_ai_spend_ip_rows",
      { p_keep_days: AI_IP_RETENTION_DAYS }
    );
    if (error) throw new Error(error.message);
    return { purged: data };
  });
}
