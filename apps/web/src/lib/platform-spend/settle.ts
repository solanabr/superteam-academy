import "server-only";

import type {
  Connection,
  SignatureStatus,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/logging";
import { getPlatformPayerKeys, type PayerRole } from "@/lib/solana/sponsor";
import { LedgerUnavailableError, type SpendStatus } from "./ledger";
import { emitServerEvent, spendSettledEvent, type ServerEvent } from "./events";

/**
 * Settlement: turn pending ledger rows into amounts once their transactions
 * are final. Runs from the on-chain queue cron (`settlePendingSpend`) and, for
 * a single sponsored enrollment, from the sponsor route's once-per check.
 */

export interface SpendRow {
  signature: string;
  /** `pending`, or `superseded` (abandoned, still followed in case it lands). */
  status: SpendStatus;
  action: string;
  user_id: string | null;
  wallet: string | null;
  course_id: string | null;
  payer: string;
  payer_role: string;
  cluster: string;
  last_valid_block_height: number | null;
  created_at: string;
}

export interface SpendAmounts {
  feeLamports: number;
  rentLamports: number;
  refundLamports: number;
}

export interface SpendTxInput {
  fee: number;
  /** Base58 keys in balance order; index 0 is the fee payer. */
  accountKeys: string[];
  preBalances: number[];
  postBalances: number[];
}

/**
 * What platform keys paid in one transaction. The fee counts only when a
 * platform key was the fee payer. Every other lamport a platform key lost is
 * rent (accounts it funded); every lamport one gained back is a refund. Each
 * key's delta is taken net of the fee it paid, so a payer that is also
 * refunded in the same transaction splits correctly.
 */
export function computeSpend(
  tx: SpendTxInput,
  platformKeys: ReadonlySet<string>
): SpendAmounts {
  const feePayer = tx.accountKeys[0];
  const feeLamports =
    feePayer !== undefined && platformKeys.has(feePayer) ? tx.fee : 0;
  let rentLamports = 0;
  let refundLamports = 0;
  tx.accountKeys.forEach((key, i) => {
    if (!platformKeys.has(key)) return;
    const pre = tx.preBalances[i] ?? 0;
    const post = tx.postBalances[i] ?? 0;
    const spent = pre - post - (key === feePayer ? feeLamports : 0);
    if (spent > 0) rentLamports += spent;
    else refundLamports += -spent;
  });
  return { feeLamports, rentLamports, refundLamports };
}

function spendInputFromTx(tx: VersionedTransactionResponse): SpendTxInput {
  const meta = tx.meta;
  if (!meta) throw new Error("transaction has no meta");
  const message = tx.transaction.message;
  const keys =
    message.version === "legacy"
      ? message.getAccountKeys()
      : message.getAccountKeys({
          accountKeysFromLookups: meta.loadedAddresses ?? undefined,
        });
  return {
    fee: meta.fee,
    accountKeys: keys
      .keySegments()
      .flat()
      .map((k) => k.toBase58()),
    preBalances: meta.preBalances,
    postBalances: meta.postBalances,
  };
}

/**
 * A row with no `last_valid_block_height` (recorded after the fact) that the
 * cluster still has never heard of after this long did not land.
 */
const UNKNOWN_EXPIRY_MS = 30 * 60_000;

/** `getSignatureStatuses` accepts at most this many signatures per call. */
const STATUS_CHUNK = 256;

type SettleConnection = Pick<
  Connection,
  "getSignatureStatuses" | "getTransaction" | "getEpochInfo"
>;

type AdminClient = ReturnType<typeof createAdminClient>;

export interface SettleDeps {
  connection: SettleConnection;
  admin: AdminClient;
  platformKeys: ReadonlyMap<string, PayerRole>;
  emit: (event: ServerEvent) => Promise<void>;
  now: () => number;
  /** Epoch ms after which no more rows are settled this pass. */
  deadline?: number;
}

/**
 * A row's state after a settle pass: its ledger status, or `unseen` for an
 * unresolved row the cluster has no trace of yet (it may never have been
 * sent). An unresolved row the cluster has seen keeps its status.
 */
export type SettleOutcome = SpendStatus | "unseen";

function isFinal(status: SignatureStatus | null): status is SignatureStatus {
  return (
    status?.confirmationStatus === "confirmed" ||
    status?.confirmationStatus === "finalized"
  );
}

function asPayerRole(role: string): PayerRole {
  return role === "sponsor" || role === "authority" ? role : "backend";
}

/**
 * Settle `rows` against the chain and return each signature's outcome after
 * this pass. A row settles at most once: the update is guarded on the status
 * the row was read with, and only the caller whose update won emits
 * `platform_spend_settled`, so two concurrent settlers never double-count a
 * transaction. Rows left when `deps.deadline` passes keep their status.
 */
export async function settleRows(
  rows: SpendRow[],
  deps: SettleDeps
): Promise<Map<string, SettleOutcome>> {
  const result = new Map<string, SettleOutcome>();
  if (rows.length === 0) return result;

  // Height first, then statuses from a node at or past that slot, so "not
  // found and past its last valid height" is never read off a lagging node.
  let blockHeight: number | null = null;
  let heightSlot = Number.MAX_SAFE_INTEGER;
  try {
    const epoch = await deps.connection.getEpochInfo("confirmed");
    blockHeight = epoch.blockHeight ?? null;
    heightSlot = epoch.absoluteSlot;
  } catch {
    // No expiry decisions this pass.
  }

  const statuses = new Map<string, SignatureStatus | null>();
  let statusSlot = 0;
  for (let i = 0; i < rows.length; i += STATUS_CHUNK) {
    const chunk = rows.slice(i, i + STATUS_CHUNK).map((r) => r.signature);
    const { context, value } = await deps.connection.getSignatureStatuses(
      chunk,
      { searchTransactionHistory: true }
    );
    statusSlot = i === 0 ? context.slot : Math.min(statusSlot, context.slot);
    chunk.forEach((sig, j) => statuses.set(sig, value[j] ?? null));
  }
  const canExpire = blockHeight !== null && statusSlot >= heightSlot;

  const userIds = await resolveUserIds(rows, deps.admin);
  const events: ServerEvent[] = [];

  for (const row of rows) {
    if (deps.deadline !== undefined && deps.now() >= deps.deadline) {
      result.set(row.signature, row.status);
      continue;
    }
    const status = statuses.get(row.signature) ?? null;
    let outcome: SpendStatus = row.status;
    let amounts: SpendAmounts = {
      feeLamports: 0,
      rentLamports: 0,
      refundLamports: 0,
    };

    if (isFinal(status)) {
      let tx: VersionedTransactionResponse | null = null;
      try {
        tx = await deps.connection.getTransaction(row.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
      } catch {
        tx = null;
      }
      if (tx?.meta) {
        const keys = new Set(deps.platformKeys.keys());
        keys.add(row.payer);
        amounts = computeSpend(spendInputFromTx(tx), keys);
        // A superseded row that landed is recorded as `superseded_landed`,
        // never `confirmed`: its replacement may hold the slot in the unique
        // index, and the once-per check counts both states as a used slot.
        outcome = status.err
          ? "failed"
          : row.status === "superseded"
            ? "superseded_landed"
            : "confirmed";
      }
    } else if (!status && canExpire) {
      const pastHeight =
        row.last_valid_block_height !== null &&
        blockHeight !== null &&
        blockHeight > row.last_valid_block_height;
      const unknownTooLong =
        row.last_valid_block_height === null &&
        deps.now() - Date.parse(row.created_at) > UNKNOWN_EXPIRY_MS;
      if (pastHeight || unknownTooLong) outcome = "expired";
    }

    if (outcome === row.status) {
      result.set(row.signature, status ? row.status : "unseen");
      continue;
    }

    const userId = row.user_id ?? userIds.get(row.wallet ?? "") ?? null;
    const { data, error } = await deps.admin
      .from("platform_spend")
      .update({
        status: outcome,
        fee_lamports: amounts.feeLamports,
        rent_lamports: amounts.rentLamports,
        refund_lamports: amounts.refundLamports,
        settled_at: new Date(deps.now()).toISOString(),
        user_id: userId,
      })
      .eq("signature", row.signature)
      .eq("status", row.status)
      .select("signature");
    if (error) {
      logEvent({
        event: "SPEND_LEDGER_002",
        level: "error",
        context: { signature: row.signature, reason: error.message },
      });
      result.set(row.signature, row.status);
      continue;
    }
    result.set(row.signature, outcome);
    const won = (data ?? []).length === 1;
    if (
      won &&
      (outcome === "confirmed" ||
        outcome === "superseded_landed" ||
        outcome === "failed")
    ) {
      events.push(
        spendSettledEvent({
          signature: row.signature,
          action: row.action,
          status: outcome === "failed" ? "failed" : "confirmed",
          payerRole: asPayerRole(row.payer_role),
          ...amounts,
          courseId: row.course_id,
          userId,
          cluster: row.cluster,
        })
      );
    }
  }

  await Promise.all(events.map((event) => deps.emit(event)));
  return result;
}

/** Fill in the learner for rows recorded with only a wallet. */
async function resolveUserIds(
  rows: SpendRow[],
  admin: AdminClient
): Promise<Map<string, string>> {
  const wallets = [
    ...new Set(
      rows.filter((r) => !r.user_id && r.wallet).map((r) => r.wallet as string)
    ),
  ];
  const ids = new Map<string, string>();
  if (wallets.length === 0) return ids;
  const { data, error } = await admin
    .from("profiles")
    .select("id, wallet_address")
    .in("wallet_address", wallets);
  if (error) return ids;
  for (const row of data ?? []) {
    if (row.wallet_address) ids.set(row.wallet_address, row.id);
  }
  return ids;
}

export function defaultSettleDeps(connection: SettleConnection): SettleDeps {
  return {
    connection,
    admin: createAdminClient(),
    platformKeys: getPlatformPayerKeys(),
    emit: emitServerEvent,
    now: Date.now,
  };
}

export interface SettleSummary {
  checked: number;
  confirmed: number;
  failed: number;
  expired: number;
  pending: number;
}

/** Give a fresh send a head start before the cron looks at it. */
const MIN_AGE_MS = 20_000;
const SETTLE_LIMIT = 100;

/** Cron entry point: settle the oldest unsettled rows. */
export async function settlePendingSpend(
  connection: SettleConnection,
  deps: SettleDeps = defaultSettleDeps(connection)
): Promise<SettleSummary> {
  const cutoff = new Date(deps.now() - MIN_AGE_MS).toISOString();
  const { data, error } = await deps.admin
    .from("platform_spend")
    .select(
      "signature, status, action, user_id, wallet, course_id, payer, payer_role, cluster, last_valid_block_height, created_at"
    )
    .in("status", ["pending", "superseded"])
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(SETTLE_LIMIT);
  if (error) throw new LedgerUnavailableError("read", error.message);

  const rows = (data ?? []) as SpendRow[];
  const statuses = await settleRows(rows, deps);
  const summary: SettleSummary = {
    checked: rows.length,
    confirmed: 0,
    failed: 0,
    expired: 0,
    pending: 0,
  };
  for (const outcome of statuses.values()) {
    if (outcome === "confirmed" || outcome === "superseded_landed") {
      summary.confirmed += 1;
    } else if (outcome === "failed" || outcome === "expired") {
      summary[outcome] += 1;
    } else {
      summary.pending += 1;
    }
  }
  return summary;
}
