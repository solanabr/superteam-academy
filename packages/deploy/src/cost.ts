import type { Connection } from "@solana/web3.js";
import {
  BUFFER_HEADER_SIZE,
  CHUNK_SIZE,
  PROGRAM_ACCOUNT_SIZE,
  PROGRAM_DATA_HEADER_SIZE,
} from "./constants";

/** Lamports per signature — the fixed Solana base fee. */
const BASE_FEE_LAMPORTS = 5_000;

/**
 * Priority fee a single deploy tx pays, in lamports.
 *
 * `deploy.ts` prices compute units at 100_000 µlamports and caps a write tx at
 * 10_000 CU, so a write costs 100_000 × 10_000 / 1e6 = 1_000 lamports. The two
 * one-off txs (buffer create, deploy) request the default budget and cost more,
 * which the 20% margin below absorbs.
 */
const PRIORITY_FEE_LAMPORTS = 1_000;

/** Margin over the computed total, for blockhash retries and resends. */
const SAFETY_MULTIPLIER = 1.2;

export interface DeployCostEstimate {
  /** Rent for the upload buffer, reclaimable only by closing it. */
  bufferRent: number;
  /** Rent for the 36-byte program account. */
  programRent: number;
  /** Rent for the ProgramData account the loader creates (2x the binary). */
  programDataRent: number;
  /** Base + priority fees across every transaction the deploy sends. */
  feeLamports: number;
  /** What the payer needs on hand, margin included. */
  totalLamports: number;
}

/**
 * What a Loader-v3 deploy of `programLen` bytes will cost the payer.
 *
 * A learner on an embedded wallet starts at zero SOL, so "Deploy" has to be
 * gated on a number rather than on a hopeful 2 SOL airdrop. The sizes mirror
 * exactly what `deployProgram` creates: a buffer of `header + len`, a 36-byte
 * program account, and the ProgramData account the loader allocates at
 * `len * 2` (the same doubling `createDeployInstruction` is handed) plus its
 * header.
 */
export async function estimateDeployCost(
  connection: Connection,
  programLen: number,
  /**
   * Transactions the payer sends beyond the deploy itself. The session-key
   * path adds two (SetAuthority, sweep) that the payer — the session key —
   * must still be able to pay for after the deploy has drained it into rent.
   */
  extraTransactions = 0
): Promise<DeployCostEstimate> {
  const [bufferRent, programRent, programDataRent] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(
      BUFFER_HEADER_SIZE + programLen
    ),
    connection.getMinimumBalanceForRentExemption(PROGRAM_ACCOUNT_SIZE),
    connection.getMinimumBalanceForRentExemption(
      PROGRAM_DATA_HEADER_SIZE + programLen * 2
    ),
  ]);

  const chunks = Math.ceil(programLen / CHUNK_SIZE);
  const feeLamports =
    (chunks + 2 + extraTransactions) *
    (BASE_FEE_LAMPORTS + PRIORITY_FEE_LAMPORTS);

  return {
    bufferRent,
    programRent,
    programDataRent,
    feeLamports,
    totalLamports: Math.ceil(
      (bufferRent + programRent + programDataRent + feeLamports) *
        SAFETY_MULTIPLIER
    ),
  };
}

/**
 * Transactions the session key sends that a plain deploy does not: the
 * `SetAuthority` that hands the program to the learner, and the sweep that
 * returns the remainder.
 */
export const SESSION_KEY_EXTRA_TRANSACTIONS = 2;

/**
 * What the learner must transfer into a freshly generated session key.
 *
 * The session key pays for everything from the buffer onwards, so if the
 * transfer is short by even one fee the deploy strands mid-upload with SOL the
 * learner cannot easily get back. Same estimate as `estimateDeployCost`, plus
 * the two transactions the session key sends on its own behalf.
 */
export function estimateSessionKeyDeployCost(
  connection: Connection,
  programLen: number
): Promise<DeployCostEstimate> {
  return estimateDeployCost(
    connection,
    programLen,
    SESSION_KEY_EXTRA_TRANSACTIONS
  );
}
