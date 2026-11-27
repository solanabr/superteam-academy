import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { removeAccountAvatar } from "@/lib/account/remove-avatar";
import { runCronJob } from "@/lib/cron/guard";
import { logEvent } from "@/lib/logging";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * How long raw IPs stay in `ai_spend_ledger`. Only today's row is read for the
 * spend cap, so this can go lower without affecting the limiter.
 */
const AI_IP_RETENTION_DAYS = 30;

/** Accounts handled per run; anything left over goes in the next one. */
const AVATAR_SWEEP_LIMIT = 100;

/**
 * GET /api/cron/account-retention — retention work with no account attached to it.
 *
 * Removes old IP rows from the AI spend ledger, which hold no account id, so account
 * deletion can't find them. Removes avatar files of deleted accounts: the deletion
 * route tries first but can't retry once the session is gone, so this is what makes
 * that removal certain. Runs daily (`apps/web/vercel.json`) and is safe to repeat.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return runCronJob("account-retention", req.headers, async () => {
    const admin = createAdminClient();

    const { data: purged, error: purgeError } = await admin.rpc(
      "purge_ai_spend_ip_rows",
      { p_keep_days: AI_IP_RETENTION_DAYS }
    );
    if (purgeError) throw new Error(purgeError.message);

    const { data: owners, error: ownersError } = await admin.rpc(
      "list_deleted_account_avatar_owners",
      { p_limit: AVATAR_SWEEP_LIMIT }
    );
    if (ownersError) throw new Error(ownersError.message);

    let avatarsRemoved = 0;
    let avatarsFailed = 0;
    for (const userId of owners ?? []) {
      try {
        await removeAccountAvatar(admin, userId);
        avatarsRemoved++;
      } catch (err: unknown) {
        avatarsFailed++;
        logEvent({
          event: "account-retention.avatar-failed",
          level: "error",
          context: {
            userId,
            message: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    return { purged, avatarsRemoved, avatarsFailed };
  });
}
