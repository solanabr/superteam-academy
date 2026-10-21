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
  | "enroll_sponsor_reenroll"
  | "enroll_refund"
  | "complete_lesson"
  | "finalize"
  | "credential"
  | "achievement"
  | "xp_mint"
  | "admin_course_write"
  | "admin_achievement_write";

export type SpendStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded";

/** The two actions that hold a once-per sponsorship slot. */
export type SponsorshipAction = "enroll_sponsor" | "enroll_sponsor_reenroll";

/**
 * What a sponsorship slot is keyed on (with the cluster). The program id and
 * the on-chain `Course.generation` are part of it: after a recreate or a
 * program move the learner must enroll again, and that is a new slot.
 */
export interface SponsorshipKey {
  wallet: string;
  courseId: string;
  programId: string;
  courseGeneration: number;
}

/**
 * The ledger could not be read or written (e.g. the migration is not applied
 * yet). The sponsor route turns it into a generic 503 and logs the detail.
 */
export class LedgerUnavailableError extends Error {
  constructor(operation: string, detail: string) {
    super(`platform_spend ${operation} failed: ${detail}`);
    this.name = "LedgerUnavailableError";
  }
}

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
  /** Sponsorship rows only: the rest of the once-per key. */
  programId?: string | null;
  courseGeneration?: number | null;
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
    program_id: record.programId ?? null,
    course_generation: record.courseGeneration ?? null,
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
 * The sponsorship holding the once-per slot for this action and key, if any.
 * Throws {@link LedgerUnavailableError} on a DB error: the caller must fail
 * closed rather than sponsor without the check.
 */
export async function findLiveSponsoredEnroll(
  action: SponsorshipAction,
  key: SponsorshipKey
): Promise<LiveSponsoredEnroll | null> {
  const { data, error } = await createAdminClient()
    .from("platform_spend")
    .select(
      "signature, status, last_valid_block_height, created_at, payer, payer_role, action, user_id, wallet, course_id, cluster"
    )
    .eq("action", action)
    .eq("cluster", spendCluster())
    .eq("program_id", key.programId)
    .eq("wallet", key.wallet)
    .eq("course_id", key.courseId)
    .eq("course_generation", key.courseGeneration)
    .in("status", ["pending", "confirmed"])
    .limit(1)
    .maybeSingle();
  if (error) throw new LedgerUnavailableError("read", error.message);
  return data as LiveSponsoredEnroll | null;
}

/** Postgres unique_violation: another live sponsorship holds the slot. */
const UNIQUE_VIOLATION = "23505";

/**
 * Reserve the once-per slot by inserting the pending sponsorship row.
 * `conflict` means a live sponsorship for this action and key already exists
 * (the partial unique index refused the insert). Any other DB error throws
 * {@link LedgerUnavailableError}, so the route refuses to sponsor rather than
 * skip the rule.
 */
export async function reserveSponsoredEnroll(
  record: PlatformTxRecord & SponsorshipKey & { action: SponsorshipAction }
): Promise<"reserved" | "conflict"> {
  const { error } = await createAdminClient()
    .from("platform_spend")
    .insert(toRow(record));
  if (!error) return "reserved";
  if (error.code === UNIQUE_VIOLATION) return "conflict";
  throw new LedgerUnavailableError("reserve", error.message);
}

/**
 * Release the slot held by a pending sponsorship the learner abandoned.
 * Guarded on `pending`, so a row that settled in the meantime is left alone
 * and this returns `false`. Settlement keeps following a superseded row, so a
 * late landing is still recorded.
 */
export async function supersedeSponsoredEnroll(
  signature: string
): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("platform_spend")
    .update({ status: "superseded" })
    .eq("signature", signature)
    .eq("status", "pending")
    .select("signature");
  if (error) throw new LedgerUnavailableError("supersede", error.message);
  return (data ?? []).length === 1;
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
  programId: string;
  userId: string | null;
}): Promise<void> {
  try {
    const { data, error } = await createAdminClient()
      .from("platform_spend")
      .select("payer, payer_role")
      .in("action", ["enroll_sponsor", "enroll_sponsor_reenroll"])
      .eq("status", "confirmed")
      .eq("cluster", spendCluster())
      .eq("program_id", input.programId)
      .eq("wallet", input.wallet)
      .eq("course_id", input.courseId)
      .order("created_at", { ascending: false })
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
      programId: input.programId,
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
