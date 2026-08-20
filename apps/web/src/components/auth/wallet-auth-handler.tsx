"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { setSiwsActive } from "@/lib/solana/ambient-wallet-store";
import { createSIWSMessage, formatSIWSMessage } from "@/lib/solana/wallet-auth";

type AuthOverlayState =
  | { status: "idle" }
  | { status: "authenticating" }
  | { status: "error"; message: string; canRetry: boolean };

/**
 * Mounts inside SolanaWalletProvider — on (platform) routes via the layout,
 * elsewhere via the sign-in modal's scoped stack. Listens for wallet
 * connection and auto-triggers SIWS authentication, showing a full-screen
 * overlay for the duration.
 *
 * The overlay goes through a PORTAL, like the wallet-select modal it follows
 * (`WalletModal` in @solana/wallet-adapter-react-ui). Since #1097 the scoped
 * stack mounts under the Header, whose bar carries `backdrop-blur-md` — a
 * non-`none` backdrop-filter makes that element a containing block for
 * `position: fixed` descendants, so an in-tree overlay is clipped to the
 * 57px nav strip. Both the spinner and the error branch (the message a stuck
 * learner most needs) were rendering inside it.
 *
 * As a body child the overlay leaves the Header's stacking context, so it
 * needs the dialog layer (z-300) rather than the old z-100 — under the
 * Header's z-200 the nav would paint over the scrim and stay clickable.
 *
 * It CAN coexist with the sign-in dialog: opening that dialog is what mounts
 * the scoped stack, and `autoConnect` reconnects a remembered wallet the
 * instant it mounts, so SIWS can fire with the dialog still up. Radix marks
 * the body `pointer-events: none` for a modal dialog and this portalled child
 * inherits it, so the overlay raises `setSiwsActive` and AuthModal closes —
 * the same handoff the manual path already does. `pointer-events-auto` covers
 * the exit-animation window, and any other modal that might be open.
 */
export function WalletAuthHandler() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const { publicKey, signMessage, signIn, connected } = useWallet();
  const hasTriedAuth = useRef(false);
  const isAuthenticating = useRef(false);
  const [overlayState, setOverlayState] = useState<AuthOverlayState>({
    status: "idle",
  });
  // Resolved in an effect, never at module scope or during render: this
  // component is server-rendered on (platform) routes, where there is no
  // `document`. A plain useEffect, not useLayoutEffect — the latter warns
  // during SSR, and nothing here needs to beat a paint: the overlay only
  // appears once the async auth flow starts, long after mount.
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  useEffect(() => setPortalTarget(document.body), []);

  // Tells anything modal above us to get out of the way while the overlay is
  // up — today that is AuthModal, which would otherwise leave the overlay's
  // buttons inert under Radix's `pointer-events: none` body.
  const overlayUp = overlayState.status !== "idle";
  const siwsOwnerRef = useRef<object>({});
  useEffect(() => {
    if (!overlayUp) return;
    return setSiwsActive(siwsOwnerRef.current);
  }, [overlayUp]);

  const authenticate = useCallback(async () => {
    if (!publicKey || (!signIn && !signMessage) || isAuthenticating.current)
      return;

    // Check if already authenticated
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return; // Already signed in

    isAuthenticating.current = true;
    setOverlayState({ status: "authenticating" });

    try {
      // Request server-issued nonce (prevents replay + race conditions)
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) {
        throw new Error("Failed to fetch nonce");
      }
      const { nonce, domain } = (await nonceRes.json()) as {
        nonce: string;
        domain: string;
      };
      const address = publicKey.toBase58();
      const statement = "Sign this message to verify your wallet ownership";

      // Prefer the Wallet Standard signIn (SIWS): the wallet builds AND signs the
      // message and returns the EXACT bytes it signed, which the server verifies
      // directly. Raw signMessage + server-side message reconstruction breaks
      // with wallets that re-serialize SIWS messages (e.g. Backpack) — the
      // signature is over different bytes, yielding "Invalid signature". Fall
      // back to signMessage for wallets without signIn.
      let messageText: string;
      let signatureArray: number[];
      let signerAddress: string;
      try {
        if (signIn) {
          const now = new Date();
          const output = await signIn({
            domain,
            statement,
            nonce,
            issuedAt: now.toISOString(),
            expirationTime: new Date(
              now.getTime() + 2 * 60 * 1000
            ).toISOString(),
          });
          messageText = new TextDecoder().decode(output.signedMessage);
          signatureArray = Array.from(output.signature);
          signerAddress = output.account.address;
        } else if (signMessage) {
          const messageBytes = new TextEncoder().encode(
            formatSIWSMessage(
              createSIWSMessage({ domain, address, statement, nonce })
            )
          );
          messageText = new TextDecoder().decode(messageBytes);
          signatureArray = Array.from(await signMessage(messageBytes));
          signerAddress = address;
        } else {
          setOverlayState({ status: "idle" });
          isAuthenticating.current = false;
          return;
        }
      } catch {
        // The learner declined the signature. This used to dismiss silently,
        // which was fine while the sign-in dialog stayed up BEHIND the
        // overlay — a decline left Google and GitHub in front of them. The
        // dialog closes now (see the SIWS flag above), so silence would empty
        // the screen: they clicked Sign in, a signature prompt they never
        // asked for appeared, they refused it, and everything vanished.
        //
        // Retry is the escape hatch that matters here, because `hasTriedAuth`
        // only resets on DISCONNECT — re-opening the modal and re-picking the
        // same still-connected wallet would not re-fire SIWS.
        setOverlayState({
          status: "error",
          message: t("signatureDeclined"),
          canRetry: true,
        });
        isAuthenticating.current = false;
        return;
      }

      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          signature: signatureArray,
          publicKey: signerAddress,
        }),
      });

      if (!response.ok) {
        let errorMsg = t("authFailed");
        // #489 — a deleted account is refused with a stable key ("accountDeleted",
        // matching the auth.accountDeleted message #461 already added) rather
        // than a raw server string, and can't be fixed by retrying.
        let canRetry = true;
        let rawKey: string | undefined;
        try {
          const body = (await response.json()) as { error?: string };
          rawKey = body.error;
          if (body.error === "accountDeleted") {
            errorMsg = t("accountDeleted");
            canRetry = false;
          } else if (body.error === "differentWalletLinked") {
            // #994 review: this 409 used to arrive as raw English prose. It is
            // now a stable key (wallet links are permanent; this account has a
            // different one), translated here rather than shown verbatim.
            errorMsg = t("differentWalletLinked");
            canRetry = false;
          }
          // Any other key (rateLimited, invalidNonce, …) keeps the translated
          // authFailed default — a raw server key is not user-facing copy.
        } catch {
          // Could not parse error body — use default message
        }
        console.error(
          "[WalletAuthHandler] Auth API error:",
          rawKey ?? errorMsg
        );
        setOverlayState({
          status: "error",
          message: errorMsg,
          canRetry,
        });
        isAuthenticating.current = false;
        return;
      }

      // Hard redirect so the Supabase client re-initializes with
      // the session cookies set by the API route. A soft navigation
      // (router.push) leaves the singleton client unaware of the
      // new session, causing Header/Sidebar to stay logged-out.
      window.location.href = `/${locale}/dashboard`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("authFailed");
      console.error("[WalletAuthHandler] Unexpected error:", message);
      setOverlayState({
        status: "error",
        message: t("authFailed"),
        canRetry: true,
      });
      isAuthenticating.current = false;
    }
  }, [publicKey, signMessage, signIn, locale, t]);

  const handleRetry = useCallback(() => {
    hasTriedAuth.current = false;
    setOverlayState({ status: "idle" });
    // Re-run authentication on next tick
    setTimeout(() => {
      hasTriedAuth.current = true;
      authenticate();
    }, 0);
  }, [authenticate]);

  const handleDismiss = useCallback(() => {
    setOverlayState({ status: "idle" });
  }, []);

  // Auto-trigger SIWS when wallet connects
  useEffect(() => {
    if (
      connected &&
      publicKey &&
      (signIn || signMessage) &&
      !hasTriedAuth.current
    ) {
      hasTriedAuth.current = true;
      authenticate();
    }
  }, [connected, publicKey, signIn, signMessage, authenticate]);

  // Reset when wallet disconnects
  useEffect(() => {
    if (!connected) {
      hasTriedAuth.current = false;
      setOverlayState({ status: "idle" });
    }
  }, [connected]);

  if (overlayState.status === "idle" || !portalTarget) return null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_80%,transparent)]"
      role="status"
      aria-live="polite"
      data-testid="siws-overlay"
    >
      <div className="flex flex-col items-center gap-4">
        {overlayState.status === "authenticating" && (
          <>
            <div className="sol-spinner" />
            <p className="font-body text-sm font-medium text-text">
              {t("signingIn")}
            </p>
          </>
        )}

        {overlayState.status === "error" && (
          <>
            <p
              className="max-w-xs text-center text-sm font-medium text-danger"
              role="alert"
            >
              {overlayState.message}
            </p>
            <div className="flex gap-3">
              {overlayState.canRetry && (
                <Button variant="push" size="sm" onClick={handleRetry}>
                  {t("retry")}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                {t("dismiss")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    portalTarget
  );
}
