/**
 * Dynamic embedded wallets — configuration and feature gate.
 *
 * Replaces Phantom Connect as the no-install wallet path. Phantom's Portal never
 * approved our app, so `Auth2 /login/start` 400'd for every learner and the
 * button was a dead end (#1017). Dynamic needs no per-app approval to work, and
 * unlike `@phantom/react-sdk` its React SDK supports React 18
 * (`"react": ">=18.0.0 <20.0.0"`), so we use the vendor's supported React
 * bindings instead of hand-wrapping a browser SDK — which is what #989 existed
 * to complain about.
 *
 * ## The gate
 *
 * Same contract the Phantom gate had, and for the same reason: this whole path
 * is optional infrastructure. SIWS with an external wallet remains the
 * guaranteed way in, so an unset environment id must degrade to "embedded
 * wallets are off" — never to a broken build or a dead sign-in button.
 *
 * The environment id is PUBLIC. It ships in the client bundle by design (it is
 * how Dynamic identifies the project from the browser); the dashboard's allowed
 * origins are what scope it. It is configuration, not a secret — the same
 * reasoning that applied to the Phantom app id.
 *
 * NOTE: `NEXT_PUBLIC_*` is inlined at build time, so changing this value
 * requires a rebuild — and a Vercel redeploy that REUSES the build cache will
 * silently keep the old one. That cost us a live incident when switching
 * Phantom off; verify by grepping the served chunks, not the dashboard.
 */

import { env } from "@/lib/env";

/**
 * The configured Dynamic environment id, or `null` when the feature is off.
 *
 * Whitespace-only counts as unset: a blank field in the Vercel dashboard or a
 * trailing space in `.env.local` is a misconfiguration, and treating it as
 * configured would hand Dynamic an unusable id and fail at connect time rather
 * than here.
 */
export function getDynamicEnvironmentId(): string | null {
  const raw = env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim();
  return raw ? raw : null;
}

/**
 * Whether the Dynamic path may be offered to a learner.
 *
 * Callers must treat `false` as "render nothing and load nothing" — no provider,
 * no SDK import, no network call, no placeholder button.
 */
export function isDynamicEnabled(): boolean {
  return getDynamicEnvironmentId() !== null;
}
