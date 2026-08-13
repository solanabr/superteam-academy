import { Transaction } from "@solana/web3.js";
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import {
  isSolanaWalletAccount,
  signTransaction,
} from "@dynamic-labs-sdk/solana";
import type { SolanaWalletAccount } from "@dynamic-labs-sdk/solana";
import { isDynamicEnabled } from "./config";

export type { SolanaWalletAccount };

/**
 * The Dynamic embedded wallet as a transaction signer.
 *
 * A learner who signed in with email holds a real Solana wallet, but not one
 * wallet-adapter knows about — `useWallet().publicKey` stays null and every
 * flow gated on it used to fall back to "connect a wallet", which is exactly
 * the ask an email sign-up can't answer. These helpers let those flows reach
 * the embedded wallet directly.
 *
 * ## On importing the Solana package's MAIN entry
 *
 * Elsewhere (`DynamicAuthHandler`) this codebase avoids the main entry because
 * it bundles the external-wallet discovery machinery alongside what it
 * actually needs. `signTransaction` leaves no choice — it is only exported
 * from the main entry — so the line held here is behavioural, not bundle-side:
 * discovery only activates when `addSolanaWalletStandardExtension` is CALLED,
 * and this app registers only the WaaS extension (`lib/dynamic/client.ts`), so
 * no wallet enumeration can occur.
 *
 * ## Signature preservation
 *
 * The WaaS signer signs the serialized MESSAGE and attaches the result with
 * `transaction.addSignature(...)` (read from the installed
 * `addWaasSolanaExtension` dist) — it never rebuilds the transaction, so the
 * backend's signature on a sponsored `enroll` (#1004) survives the round trip.
 */

/**
 * The learner's embedded Solana wallet account, or null when there isn't one.
 *
 * Null covers every non-wallet state at once — feature off, client not
 * created, SDK not initialised, signed out, or signed in without a Solana
 * account — because callers all do the same thing with them: fall back to the
 * wallet-adapter path.
 */
export function getDynamicSolanaAccount(): SolanaWalletAccount | null {
  if (!isDynamicEnabled()) return null;
  try {
    return getWalletAccounts().find(isSolanaWalletAccount) ?? null;
  } catch {
    return null;
  }
}

/**
 * Sign `transaction` with the embedded wallet via Dynamic's MPC service.
 *
 * No user prompt is involved — MPC signing happens against the wallet's
 * key shares — but it is a network round trip, so callers should keep their
 * usual timeouts around it.
 */
export async function signWithDynamicWallet(
  transaction: Transaction,
  walletAccount: SolanaWalletAccount
): Promise<Transaction> {
  // The SDK pins its own @solana/web3.js (1.98.1, exact) while the app tracks
  // ^1.98.4, so two copies of the types exist and `Transaction` is nominally
  // split by its private fields. The shapes are identical — the casts cross
  // the version boundary, nothing more. The signer mutates the transaction in
  // place (addSignature), so what returns is what went in, signed.
  type SdkTransaction = Parameters<
    typeof signTransaction
  >[0]["transaction"] extends infer U
    ? U
    : never;
  const { signedTransaction } = await signTransaction({
    transaction: transaction as unknown as SdkTransaction,
    walletAccount,
  });
  return signedTransaction as unknown as Transaction;
}
