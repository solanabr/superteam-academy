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
 *
 * SQL mirror (#1075): the email claim RPCs (`claim_due_session_reminders`,
 * `claim_due_reengagement`) apply the same predicate as
 * `lower(u.email) NOT LIKE '%@wallet.superteam-lms.local'` — see
 * supabase/migrations/20260819190000_email_claim_consent_recheck.sql. A domain
 * change must land in both languages.
 */

/** Domain suffix of the synthetic wallet-auth placeholder email. */
export const WALLET_PLACEHOLDER_EMAIL_DOMAIN = "@wallet.superteam-lms.local";

/** True when `email` is a synthetic wallet-placeholder address (any casing). */
export function isWalletPlaceholderEmail(
  email: string | null | undefined
): boolean {
  return (email ?? "").toLowerCase().endsWith(WALLET_PLACEHOLDER_EMAIL_DOMAIN);
}
