import "server-only";

import { SendTransactionError } from "@solana/web3.js";
import type {
  Connection,
  Keypair,
  Transaction,
  TransactionError,
} from "@solana/web3.js";
import { translateError } from "@coral-xyz/anchor";
import bs58 from "bs58";
import {
  recordPlatformTx,
  type SpendContext,
} from "@/lib/platform-spend/ledger";
import type { FeePayer } from "./sponsor";
import { setComputeBudget, writableAccounts } from "./compute-budget";
import { estimatePriorityFee } from "./priority-fee";

export interface SendPlatformTxOptions {
  /** Pays the fee and signs first, so its signature is the transaction id. */
  feePayer: FeePayer;
  /** Every other required signer (backend signer, fresh asset keypairs…). */
  signers?: Keypair[];
  /**
   * Compute-unit limit for the transaction (`COMPUTE_UNIT_LIMITS`). The
   * priority fee is charged on it, so it is set per instruction kind.
   */
  computeUnits: number;
  context: SpendContext;
  /**
   * The program's IDL error map. When given, failures are translated the way
   * Anchor's `.rpc()` translates them, so callers that classify AnchorError /
   * ProgramError keep working.
   */
  idlErrors?: Map<number, string>;
}

/**
 * Sign, send and confirm a server-built transaction, and record it in the
 * platform spend ledger. The one send path for platform-paid transactions.
 *
 * Mirrors Anchor's `.rpc()`: fresh blockhash, preflight at `confirmed`, wait
 * for `confirmed`, and on an on-chain failure fetch the logs so the thrown
 * error carries them. Unlike `.rpc()`, the fee payer is explicit, not the
 * provider wallet.
 *
 * The ledger row is written after the broadcast, concurrently with the
 * confirmation wait, so it adds no latency. A broadcast the node refused
 * (`SendTransactionError`: preflight revert, bad signature) never reached the
 * cluster, costs nothing and is not recorded. Any other send error is
 * ambiguous, so the row is written and settlement decides.
 *
 * Prepends the compute budget: `computeUnits` as the limit and a priority fee
 * priced on the accounts the transaction writes. The fee is part of the
 * confirmed transaction's `meta.fee`, so settlement counts it with the rest.
 */
export async function sendPlatformTransaction(
  connection: Connection,
  tx: Transaction,
  options: SendPlatformTxOptions
): Promise<string> {
  const { feePayer, signers = [], computeUnits, context, idlErrors } = options;
  const translate = (err: unknown): unknown =>
    idlErrors ? (translateError(err, idlErrors) as unknown) : err;

  const [{ blockhash, lastValidBlockHeight }, microLamports] =
    await Promise.all([
      connection.getLatestBlockhash("confirmed"),
      estimatePriorityFee(
        connection,
        writableAccounts(tx.instructions, feePayer.keypair.publicKey)
      ),
    ]);
  setComputeBudget(tx, { units: computeUnits, microLamports });
  tx.feePayer = feePayer.keypair.publicKey;
  tx.recentBlockhash = blockhash;
  // Transaction.sign dedupes by public key, so a fee payer that is also a
  // required signer (the devnet fallback) signs once.
  tx.sign(feePayer.keypair, ...signers);
  if (!tx.signature) throw new Error("transaction failed to sign");
  const signature = bs58.encode(tx.signature);

  let sendError: unknown = null;
  try {
    await connection.sendRawTransaction(tx.serialize(), {
      preflightCommitment: "confirmed",
    });
  } catch (err) {
    sendError = err;
  }

  if (sendError instanceof SendTransactionError) {
    throw translate(sendError);
  }

  const recorded = recordPlatformTx({
    ...context,
    signature,
    payer: feePayer.keypair.publicKey.toBase58(),
    payerRole: feePayer.role,
    lastValidBlockHeight,
  });

  try {
    if (sendError) throw sendError;
    const { value } = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    if (value.err) {
      throw await failedTransactionError(connection, signature, value.err);
    }
    return signature;
  } catch (err) {
    throw translate(err);
  } finally {
    await recorded;
  }
}

/** A landed-but-failed transaction, with its program logs when available. */
async function failedTransactionError(
  connection: Connection,
  signature: string,
  err: TransactionError
): Promise<Error> {
  const message = `Transaction ${signature} failed: ${JSON.stringify(err)}`;
  try {
    const failed = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = failed?.meta?.logMessages;
    if (logs) {
      return new SendTransactionError({
        action: "send",
        signature,
        transactionMessage: message,
        logs,
      });
    }
  } catch {
    // Fall through to the bare error.
  }
  return new Error(message);
}
