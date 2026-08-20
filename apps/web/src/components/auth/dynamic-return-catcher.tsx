"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { logError } from "@/lib/logging";
import {
  clearWalletReturnCapture,
  setWalletReturnCaptureActive,
} from "@/lib/solana/ambient-wallet-store";
import { ChunkErrorBoundary } from "@/components/auth/chunk-error-boundary";

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
  // A failed chunk load must clear the capture flag it set (review NEW-1):
  // no registration will ever arrive to clear it, and a stuck flag keeps
  // every sign-in trigger disabled at "Signing in…" for the page's life —
  // while an uncaught layout-level throw would take out the whole route.
  // Silent recovery is right for a headless catcher: the learner clicks
  // sign-in again and the modal path (flag now clear) takes over.
  return (
    <ChunkErrorBoundary
      onError={(error) => {
        clearWalletReturnCapture();
        logError({
          errorId: "dynamic-return-catcher.chunk-failed",
          error,
        });
      }}
    >
      <Suspense fallback={null}>
        <ScopedAuthProviders />
      </Suspense>
    </ChunkErrorBoundary>
  );
}
