import { PublicKey } from "@solana/web3.js";

/**
 * Guard for flows whose on-chain effect is bound to the account's LINKED
 * wallet (`profiles.wallet_address`) rather than to whatever wallet happens to
 * be connected in the browser.
 *
 * Enrollment is the load-bearing case. `/api/enroll/sponsor` builds the
 * transaction for the session profile's linked wallet, and the Helius webhook
 * resolves an on-chain enrollment back to a user by that same address. Signing
 * with a different wallet therefore produces an enrollment nobody can be
 * matched to: no DB row, no progress, no XP, and nothing the learner can undo
 * (close_enrollment needs that other wallet to sign). Cheaper to refuse.
 */

/** A wallet address as a key, or null when it is absent or unparseable. */
export function parseWalletAddress(
  value: string | null | undefined
): PublicKey | null {
  if (!value) return null;
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

/**
 * The linked wallet when it differs from the wallet about to sign, else null.
 *
 * Compared as keys, not strings, so encoding differences can never read as a
 * mismatch. An unparseable stored address counts as UNKNOWN rather than as a
 * mismatch — one bad row should not lock an account out of every flow — which
 * leaves it to the callers that must not act on an unknown wallet to say so.
 */
export function findWalletMismatch(
  signingAddress: string,
  linkedAddress: string | null | undefined
): string | null {
  const linked = parseWalletAddress(linkedAddress);
  const signing = parseWalletAddress(signingAddress);
  if (!linked || !signing) return null;
  return linked.equals(signing) ? null : linked.toBase58();
}

/** Whether two addresses name the same wallet. Unparseable never matches. */
export function isSameWallet(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = parseWalletAddress(a);
  const right = parseWalletAddress(b);
  return left !== null && right !== null && left.equals(right);
}
