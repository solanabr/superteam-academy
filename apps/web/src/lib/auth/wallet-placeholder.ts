/**
 * Synthetic wallet-placeholder email — single source of truth (#921).
 *
 * Wallet-first accounts are created with a deterministic, undeliverable
 * `<pubkey>@wallet.superteam-lms.local` address (see
 * `app/api/auth/wallet/route.ts`). Everything that needs to ask "is this a
 * real, deliverable email?" must go through {@link isWalletPlaceholderEmail}
 * rather than string-matching the domain locally: the predicate is
 * case-insensitive, so a differently-cased placeholder can never slip past a
 * call site (GoTrue lowercases stored emails today, but no caller should have
 * to know that).
 *
 * Importable from both server and client code — keep it dependency-free.
 */

/** Domain suffix of the synthetic wallet-auth placeholder email. */
export const WALLET_PLACEHOLDER_EMAIL_DOMAIN = "@wallet.superteam-lms.local";

/** True when `email` is a synthetic wallet-placeholder address (any casing). */
export function isWalletPlaceholderEmail(
  email: string | null | undefined
): boolean {
  return (email ?? "").toLowerCase().endsWith(WALLET_PLACEHOLDER_EMAIL_DOMAIN);
}
