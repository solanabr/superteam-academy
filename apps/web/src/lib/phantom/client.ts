/**
 * Configured Phantom Connect client (#985, epic #983).
 *
 * Builds the one `BrowserSDK` instance the app uses, or returns `null` when the
 * feature is gated off. Nothing else may construct a `BrowserSDK` — the config
 * below carries decisions that are easy to get wrong and expensive to discover
 * later.
 */

import { AddressType, BrowserSDK } from "@phantom/browser-sdk";
import { getPhantomAppId } from "./config";

/**
 * Sign-in methods offered in the Connect modal.
 *
 * `injected` is deliberately included: a learner who already runs the Phantom
 * extension connects it directly and NO embedded wallet is created, so the
 * crypto-native and email cohorts share one integration path instead of two.
 */
const AUTH_PROVIDERS = ["google", "apple", "injected"] as const;

/**
 * Solana only. The academy program, the XP mint and every credential live on
 * Solana, so requesting other address types would provision addresses we can
 * neither use nor explain to a learner.
 */
const ADDRESS_TYPES = [AddressType.solana];

/**
 * Creates the Phantom Connect client, or `null` when no app id is configured.
 *
 * Returning `null` rather than throwing keeps the gate honest: callers render
 * nothing and load nothing, and SIWS remains the guaranteed way into the app.
 */
export function createPhantomClient(): BrowserSDK | null {
  const appId = getPhantomAppId();
  if (!appId) return null;

  return new BrowserSDK({
    appId,
    providers: [...AUTH_PROVIDERS],
    addressTypes: ADDRESS_TYPES,
    // THE setting that makes graduation work. A "user-wallet" belongs to the
    // learner's own Phantom account, so downloading Phantom and choosing
    // "Continue with Google" with the same account surfaces this exact wallet —
    // same address, credentials intact, no export or import step.
    //
    // "app-wallet" would scope the wallet to this app instead. Credentials would
    // still mint correctly, but the wallet would NEVER appear in the learner's
    // Phantom app, silently destroying the reason we chose Phantom over an
    // undifferentiated embedded-wallet vendor. Set explicitly, not left to the
    // SDK default, because that default is not ours to rely on.
    embeddedWalletType: "user-wallet",
  });
}
