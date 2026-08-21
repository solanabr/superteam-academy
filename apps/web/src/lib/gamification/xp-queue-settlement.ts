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
): Promise<PendingActionRow[]> {
  const minted: PendingActionRow[] = [];
  const walletAddress = makeWalletLookup(adminClient, userId);
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

    const credited = await creditXpAndSettle(
      adminClient,
      userId,
      row,
      xpAmount,
      reason,
      row.reference_id,
      "quest" // #736 — Pass 1 credits daily-quest XP
    );

    // The DB credit is the whole story for a wallet-less learner. For a learner
    // WITH a linked wallet, the same XP should also exist as soulbound
    // Token-2022 supply, and the resulting signature belongs on the
    // xp_transactions row so the dashboard Activity feed can link it. That
    // second leg is a platform-funded on-chain write, so it is enqueued as its
    // own Pass-2 row rather than performed here: this module stays chain-free,
    // and the mint inherits the queue's freeze gate, retry budget and
    // resolved_at discipline for free. Enqueue only what actually landed
    // (`credited`, not the requested amount) — award_xp clamps against the
    // 5000/day ceiling, and minting the unclamped figure would put more XP
    // on-chain than the ledger says the learner earned.
    if (credited > 0) {
      const enqueued = await enqueueQuestXpMint(
        adminClient,
        userId,
        row,
        credited,
        reason,
        walletAddress
      );
      if (enqueued) minted.push(enqueued);
    }
  }
  return minted;
}

// One profiles read per sweep instead of one per credited row. Lazy, so a sweep
// where every credit is cap-deferred touches profiles not at all. `undefined`
// means "not looked up yet"; `null` means "looked up, no linked wallet".
function makeWalletLookup(
  adminClient: AdminClient,
  userId: string
): () => Promise<string | null> {
  let cached: string | null | undefined;
  return async () => {
    if (cached !== undefined) return cached;
    const { data, error } = await adminClient
      .from("profiles")
      .select("wallet_address")
      .eq("id", userId)
      .single();
    if (error) {
      // Do NOT cache a failure as "no wallet" — that would silently downgrade a
      // wallet-linked learner to DB-only for the rest of the sweep. The award
      // being settled right now still loses its mint permanently, for the same
      // reason a rejected enqueue does: its quest row is already resolved, so
      // nothing will ever revisit it.
      console.error(
        `[xp-queue-settlement] wallet lookup failed for ${userId} — this award will never mint on-chain (its queue row is already resolved): ${error.message}`
      );
      return null;
    }
    cached = data?.wallet_address ?? null;
    return cached;
  };
}

// Enqueue the on-chain leg for a quest credit that just landed. Returns the new
// queue row when one was created, or null when the learner has no linked wallet
// (nothing to mint to), the row already exists (a re-sweep), or the insert
// failed.
//
// Never throws: the DB credit is already committed and resolved by this point,
// and an enqueue failure must not claw it back or fail the caller's sweep.
//
// A FAILED ENQUEUE IS PERMANENT for that award. The quest row was resolved by
// creditXpAndSettle before this ran, so no later sweep will ever look at it
// again — there is no retry. That costs the explorer link and the on-chain
// mint for that one award (the XP itself is safe in the DB), so the failure is
// logged loudly rather than swallowed: supabase-js returns PostgREST errors in
// the result instead of throwing, which is exactly how a CHECK-constraint
// violation — e.g. this feature's migration not applied yet — would otherwise
// disappear in silence for every award.
async function enqueueQuestXpMint(
  adminClient: AdminClient,
  userId: string,
  row: PendingActionRow,
  amount: number,
  memo: string,
  walletAddress: () => Promise<string | null>
): Promise<PendingActionRow | null> {
  try {
    // Wallet-less (e.g. Google-only) learners stay DB-only by design. No row is
    // enqueued, so nothing can later fail or retry on their behalf.
    if (!(await walletAddress())) return null;

    // Same reference_id as the credit it mirrors, so the pair shares one
    // identity: the queue's UNIQUE(user_id, action_type, reference_id) makes a
    // duplicate enqueue impossible, and the drainer uses it to find the
    // xp_transactions row to stamp (award_xp keyed it on the same string).
    const { data: inserted, error } = await adminClient
      .from("pending_onchain_actions")
      .upsert(
        {
          user_id: userId,
          action_type: "quest_xp_mint",
          reference_id: row.reference_id,
          payload: { xpAmount: amount, memo },
        },
        {
          onConflict: "user_id,action_type,reference_id",
          ignoreDuplicates: true,
        }
      )
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        `[xp-queue-settlement] quest_xp_mint enqueue REJECTED for ${row.reference_id} (${amount} XP will never mint on-chain — is the quest_xp_mint migration applied?): ${error.message}`
      );
      return null;
    }

    return inserted ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[xp-queue-settlement] failed to enqueue quest_xp_mint for ${row.reference_id}: ${message}`
    );
    return null;
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
  // Returns the amount award_xp actually credited (0 on a cap deferral or a
  // transient failure), so a caller can act on "this much XP just landed" —
  // the quest path uses it to size the on-chain mint leg.
): Promise<number> {
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
      return credited ?? 0;
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
  return 0;
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
