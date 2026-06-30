"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createSIWSMessage, formatSIWSMessage } from "@/lib/solana/wallet-auth";

type AuthOverlayState =
  | { status: "idle" }
  | { status: "authenticating" }
  | { status: "error"; message: string; canRetry: boolean };

/**
 * Mounts at the layout level (inside SolanaWalletProvider).
 * Listens for wallet connection and auto-triggers SIWS authentication.
 * Shows a full-screen loading overlay during the auth flow.
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
        // User intentionally declined signing — dismiss silently
        setOverlayState({ status: "idle" });
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
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) {
            errorMsg = body.error;
          }
        } catch {
          // Could not parse error body — use default message
        }
        console.error("[WalletAuthHandler] Auth API error:", errorMsg);
        setOverlayState({
          status: "error",
          message: errorMsg,
          canRetry: true,
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

  if (overlayState.status === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm [background:color-mix(in_srgb,var(--bg)_80%,transparent)]"
      role="status"
      aria-live="polite"
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
    </div>
  );
}
