import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

// Chain-free XP-queue settlement. Extracted from lib/solana/onchain-queue.ts so
// the quest paths (/api/quests/daily, quest-evaluation, and the action routes
// that schedule it) never pull the Solana client graph — every client is passed
// in as a parameter, so this module's own runtime import surface is empty.

type AdminClient = ReturnType<typeof createAdminClient>;
type PendingActionRow =
  Database["public"]["Tables"]["pending_onchain_actions"]["Row"];

// ---------------------------------------------------------------------------
// Narrow sweep: deliver this user's pending quest_xp credits (DB-only)
// ---------------------------------------------------------------------------
// Called from the /api/quests/daily GET after get_daily_quest_state succeeds,
// so quest XP lands without waiting for the user's next re-auth (which a
// long-lived session may never hit). No chain calls — fast enough to await.

export async function retryQuestXpForUser(
  adminClient: AdminClient,
  userId: string
): Promise<void> {
  const { data: rows, error: fetchError } = await adminClient
    .from("pending_onchain_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", "quest_xp")
    .is("resolved_at", null)
    .lt("retry_count", 5);

  if (fetchError || !rows || rows.length === 0) return;

  await creditQuestXpRows(adminClient, userId, rows);
}

// award_xp credits by user_id, so wallet-less (e.g. Google-only) users still
// receive quest XP. The reference_id is the idempotency key, so a re-sweep of
// an already-credited row is a no-op (never a double-award). A row is only
// resolved when award_xp reports a credited amount > 0 — a credit fully eaten
// by the 5000/day cap stays unresolved (without burning a retry) and is
// re-swept once the cap window resets.
export async function creditQuestXpRows(
  adminClient: AdminClient,
  userId: string,
  rows: PendingActionRow[]
): Promise<void> {
  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;
    const xpAmount = payload.xpAmount;
    if (
      typeof xpAmount !== "number" ||
      !Number.isFinite(xpAmount) ||
      xpAmount <= 0
    ) {
      // Malformed payload — a quest_xp row must always carry a positive amount.
      // Treat as a transient failure (bump retry) rather than a silent resolve.
      await bumpRetry(
        adminClient,
        row,
        `Invalid quest_xp payload: xpAmount=${JSON.stringify(xpAmount)}`
      );
      continue;
    }
    const reason =
      typeof payload.memo === "string"
        ? payload.memo
        : `daily_quest:${row.reference_id}`;

    await creditXpAndSettle(
      adminClient,
      userId,
      row,
      xpAmount,
      reason,
      row.reference_id,
      "quest" // #736 — Pass 1 credits daily-quest XP
    );
  }
}

// ---------------------------------------------------------------------------
// Shared XP-credit settlement (durable-delivery contract)
// ---------------------------------------------------------------------------
// Credits one learning-path XP award and settles its queue row. award_xp
// RETURNS the amount actually credited (see
// supabase/migrations/20260709130000_award_xp_report_credited.sql), which is
// the signal used to tell three outcomes apart:
//   • credited > 0  → XP landed (or an idempotency-key duplicate re-reports the
//                     already-credited amount) → mark the row resolved.
//   • credited = 0  → the 5000/day cap ate the whole award. This is a DEFERRAL,
//                     not a failure: leave the row unresolved and do NOT bump
//                     retry_count, so it is re-swept once the cap window resets
//                     instead of silently losing the owed XP (the CS-7 bug).
//   • RPC error     → transient failure → bump retry_count (backoff), as before.
// The award MUST carry an idempotency key so a re-sweep is a no-op, never a
// double-credit — this is what makes deferral safe.
export async function creditXpAndSettle(
  adminClient: AdminClient,
  userId: string,
  row: PendingActionRow,
  amount: number,
  reason: string,
  idempotencyKey: string,
  // #736: the true source of this credit, stated positively by the caller (the
  // queue payload's reason may be authority-influenced, so it is not trusted to
  // reverse-derive the league-eligibility-bearing source).
  source: string
): Promise<void> {
  try {
    const { data: credited, error: xpRpcError } = await adminClient.rpc(
      "award_xp",
      {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_idempotency_key: idempotencyKey,
        p_source: source,
      }
    );
    if (xpRpcError) throw new Error(xpRpcError.message);

    if ((credited ?? 0) > 0) {
      await adminClient
        .from("pending_onchain_actions")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      // Daily cap consumed the whole credit — deferral, not failure: keep the
      // row unresolved and do NOT increment retry_count.
      await adminClient
        .from("pending_onchain_actions")
        .update({ last_error: "daily-cap-deferred" })
        .eq("id", row.id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await bumpRetry(adminClient, row, message);
  }
}

// Transient-failure bookkeeping: bump retry_count and record the error so the
// row is retried under the existing < 5 attempt budget with backoff.
export async function bumpRetry(
  adminClient: AdminClient,
  row: PendingActionRow,
  message: string
): Promise<void> {
  await adminClient
    .from("pending_onchain_actions")
    .update({
      retry_count: (row.retry_count ?? 0) + 1,
      last_error: message,
    })
    .eq("id", row.id);
}
