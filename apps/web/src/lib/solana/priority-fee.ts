import "server-only";

import type {
  Connection,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";
import { serverEnv } from "@/lib/env.server";
import { logEvent } from "@/lib/logging";
import {
  computeBudgetInstructions,
  PRIORITY_FEE_FLOOR_MICROLAMPORTS,
} from "./compute-budget";

/**
 * Priority-fee price for a transaction, from the server RPC. Helius's
 * `getPriorityFeeEstimate` first (the app's RPC), the standard
 * `getRecentPrioritizationFees` when the RPC doesn't have it, the floor when
 * neither answers in time. Never throws: a missing estimate must not fail a
 * send.
 */

/** Used when `PRIORITY_FEE_MAX_MICROLAMPORTS` is unset: one lamport per CU. */
export const DEFAULT_PRIORITY_FEE_MAX_MICROLAMPORTS = 1_000_000;

/** The whole estimate, both methods included, gives up after this. */
const ESTIMATE_TIMEOUT_MS = 2_000;

/** Helius level: the 40-60th percentile of recent fees for these accounts. */
const HELIUS_PRIORITY_LEVEL = "Medium";

/** Percentile taken from `getRecentPrioritizationFees`' per-slot minimums. */
const RECENT_FEES_PERCENTILE = 0.75;

/** The configured ceiling, micro-lamports per CU. `0` turns the fee off. */
export function priorityFeeMax(): number {
  return (
    serverEnv.PRIORITY_FEE_MAX_MICROLAMPORTS ??
    DEFAULT_PRIORITY_FEE_MAX_MICROLAMPORTS
  );
}

/**
 * `estimate` rounded up and held between the floor and `max`. A ceiling below
 * the floor wins, so an operator can set it to 0 to stop paying priority fees.
 */
export function clampPriorityFee(estimate: number, max: number): number {
  const value = Number.isFinite(estimate)
    ? Math.ceil(estimate)
    : PRIORITY_FEE_FLOOR_MICROLAMPORTS;
  return Math.max(
    0,
    Math.min(max, Math.max(PRIORITY_FEE_FLOOR_MICROLAMPORTS, value))
  );
}

type FeeConnection = Pick<
  Connection,
  "rpcEndpoint" | "getRecentPrioritizationFees"
>;

export interface EstimateOptions {
  /** Defaults to {@link priorityFeeMax}. */
  max?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

class MethodNotFoundError extends Error {}

/** Set once the RPC says it has no `getPriorityFeeEstimate`; per process. */
let heliusUnsupported = false;

async function heliusEstimate(
  connection: FeeConnection,
  accounts: string[],
  fetchImpl: typeof fetch,
  signal: AbortSignal
): Promise<number> {
  const res = await fetchImpl(connection.rpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "priority-fee",
      method: "getPriorityFeeEstimate",
      params: [
        {
          accountKeys: accounts,
          options: { priorityLevel: HELIUS_PRIORITY_LEVEL },
        },
      ],
    }),
    signal,
  });
  const body = (await res.json().catch(() => null)) as {
    result?: { priorityFeeEstimate?: unknown };
    error?: { code?: unknown };
  } | null;
  if (body?.error?.code === -32601) throw new MethodNotFoundError();
  const estimate = body?.result?.priorityFeeEstimate;
  if (typeof estimate !== "number" || !Number.isFinite(estimate)) {
    throw new Error("no priorityFeeEstimate in the response");
  }
  return estimate;
}

async function recentFeesEstimate(
  connection: FeeConnection,
  accounts: PublicKey[]
): Promise<number> {
  const fees = await connection.getRecentPrioritizationFees({
    lockedWritableAccounts: accounts,
  });
  const sorted = fees
    .map((f) => f.prioritizationFee)
    .filter((f) => Number.isFinite(f))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.floor(sorted.length * RECENT_FEES_PERCENTILE)
  );
  return sorted[index] ?? 0;
}

async function rawEstimate(
  connection: FeeConnection,
  accounts: PublicKey[],
  fetchImpl: typeof fetch,
  signal: AbortSignal
): Promise<number> {
  if (!heliusUnsupported) {
    try {
      return await heliusEstimate(
        connection,
        accounts.map((a) => a.toBase58()),
        fetchImpl,
        signal
      );
    } catch (err) {
      if (err instanceof MethodNotFoundError) heliusUnsupported = true;
      if (signal.aborted) throw err;
    }
  }
  return recentFeesEstimate(connection, accounts);
}

/**
 * The price for a transaction writing `writableAccounts`, clamped to the
 * floor and the configured ceiling. Falls back to the floor (still clamped)
 * on any failure or after {@link ESTIMATE_TIMEOUT_MS}.
 */
export async function estimatePriorityFee(
  connection: FeeConnection,
  writableAccounts: PublicKey[],
  options: EstimateOptions = {}
): Promise<number> {
  const max = options.max ?? priorityFeeMax();
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? ESTIMATE_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, timeoutMs);
  });

  try {
    const estimate = await Promise.race([
      rawEstimate(connection, writableAccounts, fetchImpl, controller.signal),
      timeout,
    ]);
    return clampPriorityFee(estimate, max);
  } catch (err) {
    // The reason only, never the error text: an RPC error can carry the
    // endpoint URL, and with it the API key.
    logEvent({
      event: "PRIORITY_FEE_001",
      context: {
        reason: controller.signal.aborted ? "timeout" : "rpc_error",
        fallback: "floor",
        kind: err instanceof Error ? err.name : typeof err,
      },
    });
    return clampPriorityFee(PRIORITY_FEE_FLOOR_MICROLAMPORTS, max);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The compute-budget instructions for a server-built transaction: `units` as
 * the limit, and the estimated price for its writable accounts.
 */
export async function priorityFeeInstructions(
  connection: FeeConnection,
  writableAccounts: PublicKey[],
  units: number
): Promise<TransactionInstruction[]> {
  const microLamports = await estimatePriorityFee(connection, writableAccounts);
  return computeBudgetInstructions({ units, microLamports });
}

/** Test seam: forget that the RPC lacked `getPriorityFeeEstimate`. */
export function resetPriorityFeeStateForTests(): void {
  heliusUnsupported = false;
}
