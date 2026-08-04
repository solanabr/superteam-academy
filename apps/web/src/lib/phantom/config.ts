/**
 * Phantom Connect configuration and feature gate (#984, epic #983).
 *
 * Phantom Connect gives learners a real Phantom wallet from an email/Google
 * sign-in — no extension, no seed phrase. This module is the single place that
 * decides whether that path is available; nothing else may read the app id.
 *
 * ## Why a gate at all
 *
 * The whole integration is optional infrastructure. SIWS remains the guaranteed
 * way into the app, so an unset app id must degrade to "embedded wallets are
 * off" rather than to a broken build or a dead sign-in button. That is why
 * `NEXT_PUBLIC_PHANTOM_APP_ID` is optional in `lib/env.ts`, exactly like the
 * analytics keys.
 *
 * ## Why `@phantom/browser-sdk` and not `@phantom/react-sdk`
 *
 * `@phantom/react-sdk` declares `peerDependencies: { react: ">=19.0.1" }` and
 * this app is on React 18.3.1, so it cannot be installed without a React 19
 * upgrade across the component tree (#989). The browser SDK carries no React
 * peer dependency and is the same underlying implementation — the React package
 * depends on it — so we lose the prebuilt bindings, not the capability.
 */

import { env } from "@/lib/env";

/**
 * The configured Phantom Connect app id, or `null` when the feature is off.
 *
 * Whitespace-only is treated as unset: a blank value in a Vercel dashboard or a
 * trailing space in `.env.local` is a misconfiguration, and reading it as
 * "configured" would send an unusable id to Phantom and fail at connect time
 * instead of here.
 */
export function getPhantomAppId(): string | null {
  const raw = env.NEXT_PUBLIC_PHANTOM_APP_ID?.trim();
  return raw ? raw : null;
}

/**
 * Whether the Phantom Connect path may be offered to a learner.
 *
 * Callers must treat `false` as "render nothing and load nothing" — no SDK
 * import, no network call, no placeholder button.
 */
export function isPhantomConnectEnabled(): boolean {
  return getPhantomAppId() !== null;
}
