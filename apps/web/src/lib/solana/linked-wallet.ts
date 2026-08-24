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

/**
 * The linked wallet when it differs from the wallet about to sign, else null.
 *
 * Returns null when no linked wallet is known — the profile may still be
 * loading, and blocking on an absent value would break the flow for everyone
 * during that window.
 */
export function findWalletMismatch(
  signingAddress: string,
  linkedAddress: string | null | undefined
): string | null {
  if (!linkedAddress) return null;
  return linkedAddress === signingAddress ? null : linkedAddress;
}
