/**
 * How an account's linked wallet was provisioned.
 *
 * `embedded` — a Dynamic WaaS wallet, created for a learner who signed in with
 * a social provider and holds no extension. Its session is a Dynamic JWT that
 * expires and, in JWT mode, is not refreshed for us; when it dies the learner
 * has no wallet at all until they sign in with the provider again.
 *
 * `external` — a wallet-adapter wallet (Phantom, Solflare, Backpack…). Its
 * "session" is the extension being connected, and reconnecting is the fix.
 *
 * `null` — unknown. Every legacy row starts here, and every caller MUST read
 * it as "not known to be embedded", so an unwritten row behaves exactly as it
 * did before the column existed.
 *
 * This is a ROUTING hint, never a trust boundary: the only thing it decides is
 * which recovery affordance a learner is shown. Nothing is authorised by it.
 */
export const WALLET_KINDS = ["embedded", "external"] as const;

export type WalletKind = (typeof WALLET_KINDS)[number];

/** Narrows an untrusted value (request body, DB column) to a `WalletKind`. */
export function parseWalletKind(value: unknown): WalletKind | null {
  return WALLET_KINDS.includes(value as WalletKind)
    ? (value as WalletKind)
    : null;
}
