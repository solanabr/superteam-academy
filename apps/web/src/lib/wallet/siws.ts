/**
 * Provider-agnostic SIWS handshake for any wallet that can sign a message.
 *
 * The wallet provider (today: Dynamic's embedded wallets; originally Phantom
 * Connect, #986) owns the *wallet* login; Supabase stays the *account*
 * identity. This is the bridge between them, and it deliberately reuses the
 * routes the wallet-adapter path already uses rather than inventing a
 * provider-specific endpoint:
 *
 * - no Supabase session yet → `/api/auth/wallet` signs the learner IN, creating
 *   the account from the wallet — a SINGLE login, not two.
 * - already signed in, no wallet linked → `/api/auth/link-wallet` attaches this
 *   wallet to the existing profile and mints any accrued XP to it.
 *
 * Everything provider-specific stays outside: callers hand in a `MessageSigner`
 * (see lib/dynamic/siws.ts for the Dynamic adapter), so this module never
 * imports a wallet SDK. Embedded wallets expose `signMessage` but not the
 * Wallet Standard `signIn`, so this takes the same build-then-sign path
 * `WalletAuthHandler` falls back to for adapters without `signIn`.
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
   * `reason` is a stable SITUATION KEY from the server, never prose — the
   * caller localises it. The two 409 keys name the situation directly
   * (#994 review — an earlier design inferred it from `mode`, and shipped
   * inverted, because the route called is a bad proxy for what went wrong):
   *   `walletAlreadyLinked`   — this wallet belongs to ANOTHER account
   *   `differentWalletLinked` — THIS account already has a different wallet
   * `mode` records which route ran, for logging/tests only — never copy.
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
export async function runWalletSiws(
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
    //
    // DELIBERATE (#994 review, confirmed not just code reuse): a transient
    // SDK/network error during signing lands here too and gets the same silent
    // treatment. That is intended parity with WalletAuthHandler's catch around
    // signIn/signMessage — wallet SDKs don't reliably distinguish "user closed
    // the prompt" from "prompt failed to open", so treating the union as a
    // quiet retry beats mislabelling a decline as an error. The retry path
    // stays open either way (the handler clears its address guard on failure).
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
