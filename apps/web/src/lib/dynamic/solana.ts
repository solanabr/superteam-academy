import { Transaction } from "@solana/web3.js";
import { getWalletAccounts } from "@dynamic-labs-sdk/client";
import {
  isSolanaWalletAccount,
  signTransaction,
} from "@dynamic-labs-sdk/solana";
import type { SolanaWalletAccount } from "@dynamic-labs-sdk/solana";
import type { WalletKind } from "@/lib/auth/wallet-kind";
import { getDynamicClient } from "./client";
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
 * What the embedded wallet is doing right now.
 *
 * This used to be a plain `SolanaWalletAccount | null`, and collapsing every
 * non-wallet state into one `null` is what produced the dead end this type
 * exists to remove: an embedded learner whose Dynamic session had expired was
 * indistinguishable from a learner with no wallet, so enrol and unenrol showed
 * them the EXTERNAL wallet-connect modal — an ask they cannot answer, with no
 * route back to Dynamic short of a full sign-out.
 *
 * - `account`  — sign with it.
 * - `expired`  — they HAD an embedded wallet and the session is gone. Offer
 *                Dynamic re-auth, never the connect modal.
 * - `loading`  — the SDK has not finished initialising (or the WaaS wallet is
 *                still hydrating). Disable the action; showing any prompt here
 *                is the init race, where a perfectly valid session got the
 *                connect modal purely because the read was early.
 * - `none`     — no embedded wallet is involved. Unchanged behaviour.
 */
export type DynamicAccountState =
  | { kind: "account"; account: SolanaWalletAccount }
  | { kind: "expired" }
  | { kind: "loading" }
  | { kind: "none" };

/**
 * The learner's embedded Solana wallet, or WHY there isn't one.
 *
 * ## Why `walletKind` has to be passed in
 *
 * After a reload past expiry the SDK holds nothing: `hydrateStateWithStorage`
 * only applies a stored session whose `sessionExpiration` is still in the
 * future, and it emits no logout event for the one it drops. So "expired" and
 * "never had one" look identical from SDK state alone — the app has to
 * remember, and where it remembers is `profiles.wallet_kind`. Callers pass
 * what their profile says; `null` (legacy/unknown) keeps the old behaviour.
 *
 * The Dynamic session storage is deliberately NOT consulted as a second
 * signal. It is a `storageTier: "secure"` adapter (async, not localStorage),
 * and `syncStateWithStorage` removes the session record on the first state
 * write where `sessionExpiresAt` is null — which is exactly what hydration
 * does when it drops an expired session. A signal that races its own erasure
 * is worse than no signal.
 */
export function getDynamicSolanaAccount(
  walletKind: WalletKind | null = null
): DynamicAccountState {
  if (!isDynamicEnabled()) return { kind: "none" };

  const client = getDynamicClient();
  if (!client) return { kind: "none" };

  let account: SolanaWalletAccount | undefined;
  try {
    account = getWalletAccounts().find(isSolanaWalletAccount);
  } catch {
    // Reading accounts before init throws; the status check below decides.
  }
  if (account) return { kind: "account", account };

  // 'uninitialized' | 'in-progress' — the read is simply early.
  if (client.initStatus !== "finished" && client.initStatus !== "failed") {
    return { kind: "loading" };
  }

  // Signed in with a live session but no Solana account yet: the WaaS keygen
  // DynamicAuthHandler starts on first sign-in is still running.
  const expiresAt = client.sessionExpiresAt;
  if (client.user && expiresAt !== null && expiresAt.getTime() > Date.now()) {
    return { kind: "loading" };
  }

  return walletKind === "embedded" ? { kind: "expired" } : { kind: "none" };
}

/**
 * Back-compat shim: the account or null, as `getDynamicSolanaAccount` used to
 * return. For call sites that genuinely have nothing to do with the failure
 * mode — anything that only asks "can I sign right now?".
 */
export function getDynamicSolanaAccountOrNull(): SolanaWalletAccount | null {
  const state = getDynamicSolanaAccount();
  return state.kind === "account" ? state.account : null;
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

/**
 * Did this failure mean "your Dynamic session is gone", rather than "the
 * program rejected the transaction"?
 *
 * The third face of the same bug: a session that dies BETWEEN the wallet read
 * and the signature. `signWithDynamicWallet` then rejects with the SDK's
 * `UnauthorizedError`, which used to reach `parseProgramError` and be toasted
 * as an unexplained failure — the learner is told the enrolment broke when
 * what actually happened is that they need to sign in again.
 *
 * Matched by NAME and CODE rather than `instanceof`: the pnpm graph holds two
 * `@dynamic-labs-sdk/client` instances (differing peer sets), so the class
 * identity does not necessarily cross the boundary — the same reason
 * `DynamicAuthHandler` re-implements `isSolanaWalletAccount` locally. Both
 * fields are set by the SDK's own error constructor.
 */
export function isDynamicSessionExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "UnauthorizedError") return true;
  return (error as Error & { code?: unknown }).code === "unauthorized_error";
}
