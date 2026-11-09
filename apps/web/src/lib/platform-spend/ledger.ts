import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/logging";
import type { PayerRole } from "@/lib/solana/sponsor";
import { spendCluster } from "@/lib/solana/sponsor";
import { sponsorshipWalletKeys } from "@/lib/platform-spend/wallet-keys";

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
  /** The platform's one funded create of a wallet's XP token account. */
  | "xp_account_fund"
  | "admin_course_write"
  | "admin_achievement_write";

export type SpendStatus =
  | "pending"
  | "confirmed"
  | "failed"
  | "expired"
  | "superseded"
  /** A superseded sponsorship that landed after all: spent, and a used slot. */
  | "superseded_landed";

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
 * What an XP token account funding slot is keyed on (with the cluster): the
 * owner and the XP mint, so a wallet gets one funded create per mint, whatever
 * course or action needed the account.
 */
export interface XpAccountFundKey {
  wallet: string;
  tokenMint: string;
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
  /** XP token account funding rows only: the mint of the funded account. */
  tokenMint?: string | null;
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
    // Only funding rows name the column, so other writes don't depend on it.
    ...(record.tokenMint ? { token_mint: record.tokenMint } : {}),
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

/** A ledger row that bears on a once-per slot (sponsorship or XP funding). */
export interface SponsorshipRow {
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

/** Statuses that say anything about the slot: held, used, or may still land. */
const SLOT_STATUSES: SpendStatus[] = [
  "pending",
  "confirmed",
  "superseded",
  "superseded_landed",
];

/**
 * Every sponsorship row for this action and key that bears on the once-per
 * slot: the live one (pending or confirmed), abandoned ones that may still
 * land (superseded) and abandoned ones that did (superseded_landed). Throws
 * {@link LedgerUnavailableError} on a DB error: the caller must fail closed
 * rather than sponsor without the check.
 */
export async function findSponsorshipRows(
  action: SponsorshipAction,
  key: SponsorshipKey
): Promise<SponsorshipRow[]> {
  const { data, error } = await createAdminClient()
    .from("platform_spend")
    .select(
      "signature, status, last_valid_block_height, created_at, payer, payer_role, action, user_id, wallet, course_id, cluster"
    )
    .eq("action", action)
    .eq("cluster", spendCluster())
    .eq("program_id", key.programId)
    .in("wallet", sponsorshipWalletKeys(key.wallet))
    .eq("course_id", key.courseId)
    .eq("course_generation", key.courseGeneration)
    .in("status", SLOT_STATUSES)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new LedgerUnavailableError("read", error.message);
  return (data ?? []) as SponsorshipRow[];
}

/**
 * Every XP token account funding row for this wallet and mint that bears on
 * its once-per slot, with the same statuses as {@link findSponsorshipRows}.
 * Throws {@link LedgerUnavailableError} on a DB error, so the caller refuses to
 * fund rather than skip the check.
 */
export async function findXpAccountFundRows(
  key: XpAccountFundKey
): Promise<SponsorshipRow[]> {
  const { data, error } = await createAdminClient()
    .from("platform_spend")
    .select(
      "signature, status, last_valid_block_height, created_at, payer, payer_role, action, user_id, wallet, course_id, cluster"
    )
    .eq("action", "xp_account_fund")
    .eq("cluster", spendCluster())
    .eq("token_mint", key.tokenMint)
    .in("wallet", sponsorshipWalletKeys(key.wallet))
    .in("status", SLOT_STATUSES)
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw new LedgerUnavailableError("read", error.message);
  return (data ?? []) as SponsorshipRow[];
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
 * Reserve the wallet's XP token account funding slot by inserting the pending
 * row for the funding transaction, before it is broadcast. `conflict` means a
 * live funding for this wallet and mint already exists. Any other DB error
 * throws {@link LedgerUnavailableError}, so nothing is funded.
 */
export async function reserveXpAccountFund(
  record: Omit<PlatformTxRecord, "action"> & XpAccountFundKey
): Promise<"reserved" | "conflict"> {
  const { error } = await createAdminClient()
    .from("platform_spend")
    .insert(toRow({ ...record, action: "xp_account_fund" }));
  if (!error) return "reserved";
  if (error.code === UNIQUE_VIOLATION) return "conflict";
  throw new LedgerUnavailableError("reserve", error.message);
}

/**
 * Mark a pending XP token account funding failed: the node refused its
 * broadcast at preflight, so it never reached the cluster and its slot is
 * free. Guarded on `pending`. Never throws: an unreleased row expires with its
 * blockhash anyway.
 */
export async function failXpAccountFund(signature: string): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("platform_spend")
      .update({ status: "failed" })
      .eq("signature", signature)
      .eq("action", "xp_account_fund")
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  } catch (err) {
    logEvent({
      event: "SPEND_LEDGER_001",
      level: "error",
      context: {
        action: "xp_account_fund",
        signature,
        reason: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

/**
 * Release the slot held by a pending sponsorship (or XP token account
 * funding) that was abandoned.
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
      .in("status", ["confirmed", "superseded_landed"])
      .eq("cluster", spendCluster())
      .eq("program_id", input.programId)
      .in("wallet", sponsorshipWalletKeys(input.wallet))
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
