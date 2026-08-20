"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { setWalletReturnCaptureActive } from "@/lib/solana/ambient-wallet-store";

const ScopedAuthProviders = lazy(
  () => import("@/components/auth/scoped-auth-providers")
);

/**
 * Completes a Dynamic redirect that lands on a provider-less route.
 *
 * Dynamic social sign-in is a full-page navigation back to the page the
 * learner left (`DynamicSocialSignIn` passes `redirectUrl: location.href`),
 * and `DynamicAuthHandler` — which finishes the handshake — used to be
 * mounted globally. Since #1097 the provider stack lives on (platform) routes
 * only, so a return landing on a marketing or admin page would strand the
 * sign-in. This component is mounted on exactly those route groups: it sniffs
 * the SDK's callback params from the URL (no SDK import — the param names are
 * the stable contract of `detectSocialRedirectUrl` /
 * `detectDeviceRegistrationRedirect`) and lazily mounts the scoped provider
 * stack, whose handlers then run the real, SDK-verified detection.
 *
 * On every ordinary page load this renders null and loads nothing.
 */
export function DynamicReturnCatcher() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (!isDynamicEnabled()) return;
    const params = new URLSearchParams(window.location.search);
    if (
      (params.has("dynamicOauthState") && params.has("dynamicOauthCode")) ||
      params.has("deviceRegistrationToken")
    ) {
      // Synchronously, BEFORE the lazy chunk resolves: AuthModal must not arm
      // its own scoped stack in the window between this decision and the
      // stack registering in the ambient store (two stacks would race
      // autoConnect and SIWS). Registration clears the flag.
      setWalletReturnCaptureActive();
      setMount(true);
    }
  }, []);

  if (!mount) return null;
  return (
    <Suspense fallback={null}>
      <ScopedAuthProviders />
    </Suspense>
  );
}
