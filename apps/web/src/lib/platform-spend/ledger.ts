import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/logging";
import type { PayerRole } from "@/lib/solana/sponsor";
import { spendCluster } from "@/lib/solana/sponsor";

/**
 * What a platform-paid transaction did. Free text in the DB (a lowercase
 * snake_case check), so adding one needs no migration.
 */
export type SpendAction =
  | "enroll_sponsor"
  | "enroll_refund"
  | "complete_lesson"
  | "finalize"
  | "credential"
  | "achievement"
  | "xp_mint"
  | "admin_course_write"
  | "admin_achievement_write";

export type SpendStatus = "pending" | "confirmed" | "failed" | "expired";

/** Who a transaction was for, when the sender knows. */
export interface SpendContext {
  action: SpendAction;
  userId?: string | null;
  /** The learner's wallet (base58), never a platform key. */
  wallet?: string | null;
  courseId?: string | null;
}

export interface PlatformTxRecord extends SpendContext {
  signature: string;
  /** Base58 key the transaction is attributed to: its fee payer. */
  payer: string;
  payerRole: PayerRole;
  /** Lets settlement call an unlanded transaction expired. */
  lastValidBlockHeight?: number | null;
}

/** A ledger write must never hold up the transaction it describes. */
const RECORD_TIMEOUT_MS = 3_000;

function toRow(record: PlatformTxRecord) {
  return {
    signature: record.signature,
    action: record.action,
    user_id: record.userId ?? null,
    wallet: record.wallet ?? null,
    course_id: record.courseId ?? null,
    payer: record.payer,
    payer_role: record.payerRole,
    cluster: spendCluster(),
    status: "pending" as const,
    last_valid_block_height: record.lastValidBlockHeight ?? null,
  };
}

/**
 * Write a pending ledger row for a transaction that was just broadcast.
 * Idempotent on the signature, so re-sending the same signed bytes is safe.
 *
 * Never throws and gives up after {@link RECORD_TIMEOUT_MS}: losing a ledger
 * row is logged (`SPEND_LEDGER_001`), but it never fails or stalls the send.
 */
export async function recordPlatformTx(
  record: PlatformTxRecord
): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), RECORD_TIMEOUT_MS);
  });
  const write = (async () => {
    const { error } = await createAdminClient()
      .from("platform_spend")
      .upsert(toRow(record), {
        onConflict: "signature",
        ignoreDuplicates: true,
      });
    return error ? error.message : null;
  })().catch((err: unknown) =>
    err instanceof Error ? err.message : String(err)
  );

  try {
    const outcome = await Promise.race([write, timeout]);
    if (outcome !== null) {
      logEvent({
        event: "SPEND_LEDGER_001",
        level: "error",
        context: {
          action: record.action,
          signature: record.signature,
          reason: outcome === "timeout" ? "timed out" : outcome,
        },
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

export interface LiveSponsoredEnroll {
  signature: string;
  status: SpendStatus;
  last_valid_block_height: number | null;
  created_at: string;
  payer: string;
  payer_role: string;
  action: string;
  user_id: string | null;
  wallet: string | null;
  course_id: string | null;
  cluster: string;
}

/**
 * The sponsored enrollment holding the once-per slot for this wallet and
 * course, if any. Throws on a DB error: the caller must fail closed rather
 * than sponsor without the check.
 */
export async function findLiveSponsoredEnroll(
  wallet: string,
  courseId: string
): Promise<LiveSponsoredEnroll | null> {
  const { data, error } = await createAdminClient()
    .from("platform_spend")
    .select(
      "signature, status, last_valid_block_height, created_at, payer, payer_role, action, user_id, wallet, course_id, cluster"
    )
    .eq("action", "enroll_sponsor")
    .eq("cluster", spendCluster())
    .eq("wallet", wallet)
    .eq("course_id", courseId)
    .in("status", ["pending", "confirmed"])
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`platform_spend read failed: ${error.message}`);
  return data as LiveSponsoredEnroll | null;
}

/** Postgres unique_violation: another live sponsorship holds the slot. */
const UNIQUE_VIOLATION = "23505";

/**
 * Reserve the once-per slot by inserting the pending `enroll_sponsor` row.
 * `conflict` means a live sponsorship for this wallet and course already
 * exists (the partial unique index refused the insert). Any other DB error
 * throws, so the route refuses to sponsor rather than skip the rule.
 */
export async function reserveSponsoredEnroll(
  record: PlatformTxRecord
): Promise<"reserved" | "conflict"> {
  const { error } = await createAdminClient()
    .from("platform_spend")
    .insert(toRow({ ...record, action: "enroll_sponsor" }));
  if (!error) return "reserved";
  if (error.code === UNIQUE_VIOLATION) return "conflict";
  throw new Error(`platform_spend reserve failed: ${error.message}`);
}

/**
 * Record the learner's `close_enrollment` for an enrollment the sponsor paid
 * for, so settlement can count the rent that came back to the payer. The
 * learner sends that transaction, not the server, so the Helius webhook calls
 * this. A no-op when the enrollment was not sponsored. Never throws.
 */
export async function recordSponsoredEnrollRefund(input: {
  signature: string;
  wallet: string;
  courseId: string;
  userId: string | null;
}): Promise<void> {
  try {
    const { data, error } = await createAdminClient()
      .from("platform_spend")
      .select("payer, payer_role")
      .eq("action", "enroll_sponsor")
      .eq("status", "confirmed")
      .eq("cluster", spendCluster())
      .eq("wallet", input.wallet)
      .eq("course_id", input.courseId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return;
    await recordPlatformTx({
      signature: input.signature,
      action: "enroll_refund",
      userId: input.userId,
      wallet: input.wallet,
      courseId: input.courseId,
      payer: data.payer,
      payerRole: data.payer_role === "sponsor" ? "sponsor" : "backend",
    });
  } catch (err) {
    logEvent({
      event: "SPEND_LEDGER_001",
      level: "error",
      context: {
        action: "enroll_refund",
        signature: input.signature,
        reason: err instanceof Error ? err.message : String(err),
      },
    });
  }
}
