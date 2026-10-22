import { ComputeBudgetProgram } from "@solana/web3.js";
import type {
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * Compute budget for every transaction the app sends or hands to a wallet: an
 * explicit compute-unit limit and a priority-fee price. Shared by the server
 * (`priority-fee.ts`) and the browser, so nothing here reads env or the RPC.
 *
 * The priority fee is charged on the requested limit, not on what the
 * transaction consumes, so the limit is set per instruction kind instead of
 * the runtime default of 200k CU per instruction.
 */

/**
 * Lowest price set, in micro-lamports per CU, and the price used when no
 * estimate is available (RPC error, timeout, route down). Small enough to be
 * noise on devnet; enough to keep a transaction out of the zero-fee tail on
 * mainnet when the estimate is missing.
 */
export const PRIORITY_FEE_FLOOR_MICROLAMPORTS = 10_000;

/**
 * Compute-unit limit per instruction kind, for transactions whose size the
 * app does not simulate first. Each is a few times the most the transaction
 * has consumed on devnet (ATA creation included where the transaction creates
 * one), because the canonical-bump search behind on-chain PDA and ATA
 * derivation varies by address, ~1,500 CU per extra iteration. Program-side
 * figures: `docs/CU-BUDGET-REVIEW.md`. A limit too low fails the transaction
 * with the fee still charged, so err high; the price clamp bounds the cost.
 */
export const COMPUTE_UNIT_LIMITS = {
  /** `enroll` alone, server-built for a sponsored enrollment. */
  enroll: 40_000,
  /** Learner-sent `close_enrollment`, when its simulation reports no units. */
  closeEnrollment: 30_000,
  /** XP token account (idempotent create) + `complete_lesson`. */
  completeLesson: 80_000,
  /** Learner and creator token accounts + `finalize_course`. */
  finalizeCourse: 100_000,
  /** `issue_credential` (Metaplex Core asset create). */
  issueCredential: 100_000,
  /** Recipient token account + `award_achievement` (Core mint + XP). */
  awardAchievement: 150_000,
  /** Recipient token account + `reward_xp`. */
  rewardXp: 80_000,
  /** Recipient token account + Token-2022 `mint_to`. */
  xpMint: 60_000,
  createCourse: 60_000,
  updateCourse: 40_000,
  closeCourse: 60_000,
  /** `create_achievement_type`, which creates its Core collection. */
  createAchievementType: 100_000,
  /** Metaplex Core `create_collection_v2`, sent directly. */
  createCollection: 80_000,
} as const;

export type ComputeKind = keyof typeof COMPUTE_UNIT_LIMITS;

/** The runtime's per-transaction ceiling. */
export const MAX_COMPUTE_UNIT_LIMIT = 1_400_000;

export interface ComputeBudget {
  /** Compute-unit limit for the whole transaction. */
  units: number;
  /** Priority-fee price, micro-lamports per compute unit. */
  microLamports: number;
}

/** `SetComputeUnitLimit` then `SetComputeUnitPrice`. */
export function computeBudgetInstructions(
  budget: ComputeBudget
): TransactionInstruction[] {
  const units = Math.min(
    MAX_COMPUTE_UNIT_LIMIT,
    Math.max(1, Math.ceil(budget.units))
  );
  const microLamports = Math.max(0, Math.floor(budget.microLamports));
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
  ];
}

function isComputeBudget(ix: TransactionInstruction): boolean {
  return ix.programId.equals(ComputeBudgetProgram.programId);
}

/**
 * Put the compute budget at the front of `tx`, replacing any it already has
 * (a duplicate compute-budget instruction fails the transaction). Call before
 * signing: it changes the message.
 */
export function setComputeBudget(
  tx: Transaction,
  budget: ComputeBudget
): Transaction {
  tx.instructions = [
    ...computeBudgetInstructions(budget),
    ...tx.instructions.filter((ix) => !isComputeBudget(ix)),
  ];
  return tx;
}

/**
 * The accounts a transaction writes, fee payer first, deduplicated. These are
 * what its local fee market is priced on.
 */
export function writableAccounts(
  instructions: readonly TransactionInstruction[],
  feePayer?: PublicKey | null
): PublicKey[] {
  const seen = new Map<string, PublicKey>();
  if (feePayer) seen.set(feePayer.toBase58(), feePayer);
  for (const ix of instructions) {
    if (isComputeBudget(ix)) continue;
    for (const meta of ix.keys) {
      if (meta.isWritable) seen.set(meta.pubkey.toBase58(), meta.pubkey);
    }
  }
  return [...seen.values()];
}

/**
 * A limit from a simulation's `unitsConsumed`: 20% over it plus a fixed
 * margin for the compute-budget instructions themselves. `fallback` when the
 * simulation reported nothing usable.
 */
export function computeUnitLimitFromSimulation(
  unitsConsumed: number | null | undefined,
  fallback: number
): number {
  if (
    typeof unitsConsumed !== "number" ||
    !Number.isFinite(unitsConsumed) ||
    unitsConsumed <= 0
  ) {
    return fallback;
  }
  return Math.min(
    MAX_COMPUTE_UNIT_LIMIT,
    Math.ceil(unitsConsumed * 1.2) + 5_000
  );
}
