import "server-only";

import {
  SendTransactionError,
  Transaction,
  type Connection,
  type PublicKey,
  type TransactionInstruction,
  type VersionedTransactionResponse,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  failXpAccountFund,
  findXpAccountFundRows,
  reserveXpAccountFund,
  type XpAccountFundKey,
} from "@/lib/platform-spend/ledger";
import { logEvent } from "@/lib/logging";
import { slotState } from "@/lib/platform-spend/slot";
import { emitServerEvent } from "@/lib/platform-spend/events";
import type { FeePayer } from "./sponsor";
import { sendPlatformTransaction } from "./platform-tx";
import { COMPUTE_UNIT_LIMITS } from "./compute-budget";
import {
  XpAccountClosedError,
  XpAccountFundingInFlightError,
} from "./xp-account-errors";

/** Newest signatures read from the account's history. */
const HISTORY_LIMIT = 100;
/** Transactions fetched per batched request. */
const HISTORY_BATCH = 25;

/**
 * Every platform-signed XP transaction needs the recipient's Token-2022 XP
 * token account to exist. This is the one place that makes sure it does, and
 * the one place the platform pays for one.
 *
 * - The account exists: nothing is sent.
 * - It is missing and the wallet's funding slot for this mint is free: one
 *   transaction creates it, paid by `feePayer`, and the transaction that needed
 *   it goes out afterwards with no create of its own.
 * - It is missing and the slot is used: {@link XpAccountClosedError}. The owner
 *   closed the account the platform funded, and recreates it at their own cost.
 *
 * The slot is a `xp_account_fund` row in the spend ledger, reserved under the
 * funding transaction's signature before it is broadcast and held by a partial
 * unique index on (cluster, mint, wallet). Wallets the platform funded before
 * the ledger tracked this have no row, so a missing account is also checked
 * against its address's on-chain history: an account that existed and was
 * closed counts as funded. A funding that was broadcast holds the slot until
 * it lands or its blockhash expires; one the node refused at preflight frees
 * it at once. Any ledger or RPC failure throws, and nothing is funded.
 *
 * The course creator's account on finalize uses
 * {@link creatorXpTokenAccount} instead.
 */
export async function ensureXpTokenAccount(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
  feePayer: FeePayer,
  context: { courseId?: string | null } = {}
): Promise<PublicKey> {
  const account = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Anything else at the address (lamports sent to it) is not a token account
  // yet; the create takes it over.
  const info = await connection.getAccountInfo(account, "confirmed");
  if (info?.owner.equals(TOKEN_2022_PROGRAM_ID)) return account;

  const key: XpAccountFundKey = {
    wallet: owner.toBase58(),
    tokenMint: mint.toBase58(),
  };
  const slot = await slotState(
    await findXpAccountFundRows(key),
    connection,
    emitServerEvent,
    // The server broadcasts right after reserving, so an attempt the cluster
    // hasn't reported yet may still land.
    { unseenIsInFlight: true }
  );
  if (slot === "in_flight") throw new XpAccountFundingInFlightError(key.wallet);
  if (slot === "used" || (await existedBefore(connection, account))) {
    throw new XpAccountClosedError(key.wallet, key.tokenMint);
  }

  const tx = new Transaction().add(
    createInstruction(feePayer, account, owner, mint)
  );
  let reservedSignature: string | null = null;
  try {
    await sendPlatformTransaction(connection, tx, {
      feePayer,
      computeUnits: COMPUTE_UNIT_LIMITS.xpAccountFund,
      context: {
        action: "xp_account_fund",
        wallet: key.wallet,
        courseId: context.courseId ?? null,
      },
      beforeSend: async ({ signature, lastValidBlockHeight }) => {
        const reserved = await reserveXpAccountFund({
          ...key,
          signature,
          courseId: context.courseId ?? null,
          payer: feePayer.keypair.publicKey.toBase58(),
          payerRole: feePayer.role,
          lastValidBlockHeight,
        });
        if (reserved === "conflict") {
          throw new XpAccountFundingInFlightError(key.wallet);
        }
        reservedSignature = signature;
      },
    });
  } catch (err) {
    // Only proof that no account was created frees the slot early. Any other
    // error (a gateway can return an error body after forwarding) leaves the
    // row pending until the funding lands or its blockhash expires.
    if (
      reservedSignature &&
      (rejectedAtPreflight(err) ||
        (await landedAndFailed(connection, reservedSignature)))
    ) {
      await failXpAccountFund(reservedSignature);
    }
    throw err;
  }
  return account;
}

/**
 * The node simulated the transaction and refused it, so it was never
 * forwarded. web3.js reports every JSON-RPC error body as a
 * SendTransactionError (with action "simulate" whenever preflight is on), so
 * only the node's own simulation-failure message counts. A gateway that fans
 * the bytes out to several upstreams can return a lagging upstream's
 * "Blockhash not found" or "already been processed" after another upstream
 * forwarded, so those two wait for expiry instead.
 */
function rejectedAtPreflight(err: unknown): boolean {
  if (!(err instanceof SendTransactionError)) return false;
  const message = err.transactionError.message;
  return (
    /Transaction simulation failed/.test(message) &&
    !/Blockhash not found|already been processed/.test(message)
  );
}

/** The transaction is confirmed on-chain with an error, so nothing changed. */
async function landedAndFailed(
  connection: Connection,
  signature: string
): Promise<boolean> {
  try {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];
    return (
      !!status?.err &&
      (status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized")
    );
  } catch {
    // Unknown: leave the row for settlement.
    return false;
  }
}

/**
 * The course creator's XP token account for `finalize_course`, which needs it
 * for every learner who finishes the course. It is not held to the
 * once-per-wallet slot, so a creator who closed theirs never stops their
 * learners' finalize: when it is missing, the returned instruction creates it
 * inside the finalize transaction, paid by `feePayer`, and each such create is
 * logged with the creator's wallet.
 */
export async function creatorXpTokenAccount(
  connection: Connection,
  creator: PublicKey,
  mint: PublicKey,
  feePayer: FeePayer,
  courseId: string
): Promise<{
  account: PublicKey;
  createInstruction: TransactionInstruction | null;
}> {
  const account = getAssociatedTokenAddressSync(
    mint,
    creator,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(account, "confirmed");
  if (info?.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return { account, createInstruction: null };
  }
  logEvent({
    event: "xp-account.creator-funded",
    level: "warn",
    context: {
      creator: creator.toBase58(),
      mint: mint.toBase58(),
      courseId,
    },
  });
  return {
    account,
    createInstruction: createInstruction(feePayer, account, creator, mint),
  };
}

function createInstruction(
  feePayer: FeePayer,
  account: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction {
  return createAssociatedTokenAccountIdempotentInstruction(
    feePayer.keypair.publicKey,
    account,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Whether a token account lived at `account` before. True when a transaction
 * in its recent history lists it in its token balances, which only a real
 * token account produces; a transaction that merely names the address does
 * not count. A full window with no such entry can't rule it out, so it counts
 * too.
 */
async function existedBefore(
  connection: Connection,
  account: PublicKey
): Promise<boolean> {
  const signatures = await connection.getSignaturesForAddress(
    account,
    { limit: HISTORY_LIMIT },
    "confirmed"
  );
  if (signatures.length === 0) return false;

  const address = account.toBase58();
  for (let i = 0; i < signatures.length; i += HISTORY_BATCH) {
    const batch = signatures
      .slice(i, i + HISTORY_BATCH)
      .map((s) => s.signature);
    const txs = await connection.getTransactions(batch, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    for (const [j, tx] of txs.entries()) {
      if (!tx?.meta) {
        throw new Error(
          `history transaction ${batch[j]} for ${address} is unavailable`
        );
      }
      if (listsTokenAccount(tx, address)) return true;
    }
  }
  return signatures.length >= HISTORY_LIMIT;
}

function listsTokenAccount(
  tx: VersionedTransactionResponse,
  address: string
): boolean {
  const meta = tx.meta;
  if (!meta) return false;
  const message = tx.transaction.message;
  const keys = (
    message.version === "legacy"
      ? message.getAccountKeys()
      : message.getAccountKeys({
          accountKeysFromLookups: meta.loadedAddresses ?? undefined,
        })
  )
    .keySegments()
    .flat();
  return [...(meta.preTokenBalances ?? []), ...(meta.postTokenBalances ?? [])]
    .map((b) => keys[b.accountIndex]?.toBase58())
    .includes(address);
}
