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
  const { publicKey, signMessage, connected } = useWallet();
  const hasTriedAuth = useRef(false);
  const isAuthenticating = useRef(false);
  const [overlayState, setOverlayState] = useState<AuthOverlayState>({
    status: "idle",
  });

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage || isAuthenticating.current) return;

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

      const siwsMessage = createSIWSMessage({
        domain,
        address,
        statement: "Sign this message to verify your wallet ownership",
        nonce,
      });

      const messageText = formatSIWSMessage(siwsMessage);
      const messageBytes = new TextEncoder().encode(messageText);

      let signature: Uint8Array;
      try {
        signature = await signMessage(messageBytes);
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
          signature: Array.from(signature),
          publicKey: address,
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
  }, [publicKey, signMessage, locale, t]);

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
    if (connected && publicKey && signMessage && !hasTriedAuth.current) {
      hasTriedAuth.current = true;
      authenticate();
    }
  }, [connected, publicKey, signMessage, authenticate]);

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
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
