/**
 * SIWS handshake for the Phantom embedded wallet (#986, epic #983).
 *
 * Phantom Connect owns the *wallet* login; Supabase stays the *account*
 * identity. This is the bridge between them, and it deliberately reuses the
 * routes the wallet-adapter path already uses rather than inventing a
 * Phantom-specific endpoint:
 *
 * - no Supabase session yet → `/api/auth/wallet` signs the learner IN, creating
 *   the account from the wallet. That keeps "Continue with Phantom" a SINGLE
 *   login rather than making someone authenticate to Google twice (once for
 *   Phantom, once for Supabase).
 * - already signed in, no wallet linked → `/api/auth/link-wallet` attaches this
 *   wallet to the existing profile and mints any accrued XP to it.
 *
 * The embedded wallet exposes `signMessage` but not the Wallet Standard
 * `signIn`, so this takes the same build-then-sign path `WalletAuthHandler`
 * falls back to for adapters without `signIn`.
 */

import { createSIWSMessage, formatSIWSMessage } from "@/lib/solana/wallet-auth";

/** Matches the `signMessage` surface of the SDK's Solana chain object. */
export interface MessageSigner {
  signMessage(message: string | Uint8Array): Promise<{
    signature: Uint8Array;
    publicKey: string;
  }>;
}

export type SiwsOutcome =
  | { ok: true; mode: "signedIn" | "linked" }
  /**
   * `reason` is a MESSAGE KEY, never server prose — the caller localises it.
   * `walletAlreadyLinked` covers two different situations the learner needs
   * told apart, so the caller decides the wording from `mode`.
   */
  | { ok: false; reason: string; mode: "signIn" | "link" };

const STATEMENT = "Sign this message to verify your wallet ownership";

/**
 * Signs a server-issued SIWS nonce with the embedded wallet and exchanges it
 * for either a Supabase session or a wallet link.
 *
 * @param signer   the SDK's Solana chain object
 * @param address  the connected Solana address
 * @param hasSession whether a Supabase session already exists — decides which
 *                   route runs, and therefore whether this signs in or links
 */
export async function runPhantomSiws(
  signer: MessageSigner,
  address: string,
  hasSession: boolean
): Promise<SiwsOutcome> {
  const mode = hasSession ? "link" : "signIn";

  // Server-issued nonce: replay protection lives server-side, so a nonce this
  // client invented would be rejected.
  const nonceRes = await fetch("/api/auth/nonce");
  if (!nonceRes.ok) return { ok: false, reason: "authFailed", mode };
  const { nonce, domain } = (await nonceRes.json()) as {
    nonce: string;
    domain: string;
  };

  const messageText = formatSIWSMessage(
    createSIWSMessage({ domain, address, statement: STATEMENT, nonce })
  );

  let signature: Uint8Array;
  try {
    ({ signature } = await signer.signMessage(
      new TextEncoder().encode(messageText)
    ));
  } catch {
    // Declining the signature prompt is an ordinary choice, not a failure to
    // report: the caller resets quietly and the learner can try again.
    return { ok: false, reason: "declined", mode };
  }

  const route = hasSession ? "/api/auth/link-wallet" : "/api/auth/wallet";
  const res = await fetch(route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: messageText,
      signature: Array.from(signature),
      publicKey: address,
    }),
  });

  if (res.ok) return { ok: true, mode: hasSession ? "linked" : "signedIn" };

  // Error keys pass through verbatim so the caller can localise them; the
  // routes already return stable keys ("walletAlreadyLinked", "accountDeleted")
  // rather than prose.
  let reason = "authFailed";
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) reason = body.error;
  } catch {
    // Unparseable body — the generic key is the honest answer.
  }
  return { ok: false, reason, mode };
}
