/**
 * The client half of the Dynamic social bridge: Dynamic session in, Supabase
 * session out, via `POST /api/auth/dynamic`.
 *
 * ## Redirect, not popup
 *
 * `signInWithSocialPopUp` is React-Native only — the installed dist's web build
 * throws `MethodNotImplementedError` unconditionally, and its own docblock says
 * "On web, use signInWithSocialRedirect + completeSocialRedirect instead". Web
 * social sign-in is therefore a FULL PAGE navigation
 * (`createNavigationHandler` sets `window.location.href`), so the click handler
 * can never await the result. The return leg is picked up by
 * `DynamicAuthHandler`, which is mounted on every page.
 *
 * ## Which token
 *
 * Dynamic keeps TWO tokens in client state and they are not interchangeable:
 *
 * - `token` — the MINIFIED access JWT (`response.minifiedJwt`). Its model
 *   (`@dynamic-labs/sdk-api-core` `MinifiedDynamicJwt`) carries only credential
 *   HASHES, no `verified_credentials` array at all.
 * - `legacyToken` — the full `DynamicJwt` (`response.jwt`), which is the one
 *   that carries `verified_credentials` with the provider-verified email.
 *
 * `/api/auth/dynamic` matches accounts on exactly that array, so the minified
 * token would be signature-valid and still 403 with `noVerifiedOauthEmail`.
 * Only `legacyToken` works, deprecation notice notwithstanding — the route and
 * the SDK disagree about which token is "current", and the route is the one
 * that decides what a valid bridge looks like.
 *
 * `legacyToken` lives on core state rather than the public `DynamicClient`
 * (which exposes only `token`), so it is read through the SDK's own supported
 * escape hatch: `getCore` from the `/core` "Extension Development" entry point.
 *
 * Both tokens are `null` when the Dynamic environment is configured for
 * COOKIE-based auth — the API then returns neither `jwt` nor `minifiedJwt`, and
 * an httpOnly cookie the browser cannot read holds the session instead. That is
 * a dashboard setting, not something this code can detect ahead of time, so a
 * missing token is reported as a normal failure rather than treated as
 * impossible.
 */

import { getCore } from "@dynamic-labs-sdk/client/core";
import { getDynamicClient } from "@/lib/dynamic/client";

/**
 * Message keys in the `auth` namespace. Returned instead of a rendered string
 * so this module stays free of React and of the translation context.
 */
export type DynamicBridgeErrorKey =
  | "googleEmailUnmatched"
  | "accountDeleted"
  | "otpRateLimited"
  | "googleBridgeFailed";

export type DynamicBridgeOutcome =
  | { ok: true }
  | { ok: false; errorKey: DynamicBridgeErrorKey };

/**
 * The route's `error` strings, mapped to copy a learner can act on. Anything
 * unrecognised — including a 500 with no body — falls through to the generic
 * key, because the alternative is a blank toast.
 */
const ERROR_KEYS: Record<string, DynamicBridgeErrorKey> = {
  noVerifiedOauthEmail: "googleEmailUnmatched",
  ambiguousVerifiedEmail: "googleEmailUnmatched",
  accountDeleted: "accountDeleted",
  rateLimited: "otpRateLimited",
};

/** The full Dynamic JWT for the current session, or `null`. */
export function getDynamicAuthToken(): string | null {
  const client = getDynamicClient();
  if (!client) return null;
  try {
    return getCore(client).state.get().legacyToken;
  } catch {
    return null;
  }
}

/**
 * Exchange the current Dynamic session for a Supabase session.
 *
 * Does NOT reload — the caller decides, because it also has to decide what to
 * tear down first when this fails.
 */
export async function bridgeDynamicSession(): Promise<DynamicBridgeOutcome> {
  const dynamicJwt = getDynamicAuthToken();
  if (!dynamicJwt) return { ok: false, errorKey: "googleBridgeFailed" };

  try {
    const response = await fetch("/api/auth/dynamic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dynamicJwt }),
    });

    const body: unknown = await response.json().catch(() => null);
    const error =
      typeof body === "object" && body !== null && "error" in body
        ? (body as { error?: unknown }).error
        : undefined;

    if (response.ok && (body as { success?: unknown })?.success === true) {
      return { ok: true };
    }

    return {
      ok: false,
      errorKey:
        (typeof error === "string" ? ERROR_KEYS[error] : undefined) ??
        "googleBridgeFailed",
    };
  } catch {
    return { ok: false, errorKey: "googleBridgeFailed" };
  }
}

/**
 * Social-return pending state, published by `DynamicAuthHandler` while the
 * redirect-return handshake runs and consumed by the sign-in buttons (via
 * `useSocialReturnPending`) so THEY carry the loading state — the owner's
 * call over a full-screen overlay. A module-level store because the handler
 * and the header render in unrelated trees; threading a context through the
 * layout for one boolean would be all ceremony.
 */
let socialReturnPending = false;
const pendingListeners = new Set<() => void>();

export function setSocialReturnPending(pending: boolean): void {
  socialReturnPending = pending;
  pendingListeners.forEach((listener) => listener());
}

export function subscribeSocialReturnPending(listener: () => void): () => void {
  pendingListeners.add(listener);
  return () => {
    pendingListeners.delete(listener);
  };
}

export function getSocialReturnPending(): boolean {
  return socialReturnPending;
}
