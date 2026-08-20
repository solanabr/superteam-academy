"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { trackEvent } from "@/lib/analytics";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { useAmbientWalletLive } from "@/lib/solana/ambient-wallet-store";
import { DynamicSocialSignIn } from "@/components/auth/dynamic-social-sign-in";
import { OAuthFallbackButton } from "@/components/auth/oauth-fallback-button";
import type { AuthLoadingMethod } from "@/components/auth/auth-modal-types";

export interface AuthModalBodyProps {
  loading: AuthLoadingMethod;
  setLoading: (v: AuthLoadingMethod) => void;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  setOpen: (v: boolean) => void;
  showLater: boolean;
  onLater?: () => void;
  /** The scoped provider stack's chunk failed to load. */
  walletStackFailed: boolean;
  /** Re-arms that chunk. The Solana button is its own retry affordance. */
  retryWalletStack: () => void;
  /**
   * Runs the timed close-then-open-the-wallet-picker sequence. Owned by the
   * shell, not here: closing the dialog unmounts this body, so timers started
   * here would be cleared exactly when the picker is due to open.
   */
  startWalletHandoff: () => void;
}

/**
 * The sign-in buttons inside the dialog. A separate, lazily-loaded module
 * (#1097): its import graph (DynamicSocialSignIn → the Dynamic SDK) is
 * exactly what must stay out of the global header chunk, and AuthModal
 * renders in the Header on every route. Never import this statically from
 * anything layout-reachable.
 *
 * Needs no provider above it in the React tree: the wallet-select modal is
 * reached through the ambient store (the live stack registers
 * `openWalletModal`), and the Dynamic buttons call the SDK imperatively.
 *
 * Only the Solana button depends on that stack, so only it waits for one
 * (#1109 review): gating the whole body on a live registration made Google
 * and GitHub — which need nothing but Supabase — hostage to a ~300 kB
 * download, and serialised the two chunks besides.
 */
export default function AuthModalBody({
  loading,
  setLoading,
  errorMessage,
  setErrorMessage,
  setOpen,
  showLater,
  onLater,
  walletStackFailed,
  retryWalletStack,
  startWalletHandoff,
}: AuthModalBodyProps) {
  const t = useTranslations("auth");
  const dynamicEnabled = isDynamicEnabled();
  const walletStackLive = useAmbientWalletLive();
  // Set when the learner picks Solana before a stack has registered; the
  // effect below finishes the handoff as soon as one does.
  const awaitingStack = useRef(false);

  useEffect(() => {
    if (!awaitingStack.current) return;
    if (walletStackLive) {
      awaitingStack.current = false;
      startWalletHandoff();
    } else if (walletStackFailed) {
      // No stack is coming. Say so instead of spinning forever — the other
      // two methods on this screen still work.
      awaitingStack.current = false;
      setLoading(null);
      setErrorMessage(t("authFailed"));
    }
  }, [
    walletStackLive,
    walletStackFailed,
    startWalletHandoff,
    setLoading,
    setErrorMessage,
    t,
  ]);

  const handleConnectSolana = () => {
    setLoading("solana");
    setErrorMessage(null);
    trackEvent("auth_method_selected", { method: "solana" });
    if (walletStackLive) {
      startWalletHandoff();
      return;
    }
    // No stack yet — wait for one. If a previous attempt's chunk died, this
    // click re-arms it too, so the button doubles as its own retry: either a
    // stack registers and the handoff runs, or the effect above reports the
    // failure and clears the loading state.
    awaitingStack.current = true;
    if (walletStackFailed) retryWalletStack();
  };

  return (
    <div className="mt-6 space-y-3">
      <Button
        variant="outline"
        className="h-12 w-full gap-3 text-sm font-medium"
        onClick={handleConnectSolana}
        disabled={loading !== null}
      >
        {loading === "solana" ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <SolanaLogo className="h-5 w-5 shrink-0" />
        )}
        {loading === "solana" ? t("connecting") : t("connectSolanaWallet")}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-bg px-2 text-text-3">{t("or")}</span>
        </div>
      </div>

      {/* Google and GitHub go through Dynamic when it is configured, so the
          learner also walks away with an embedded wallet; the Supabase OAuth
          buttons are the fallback AND the kill switch — unsetting the
          environment id restores them untouched. */}
      {(["google", "github"] as const).map((provider) =>
        dynamicEnabled ? (
          <DynamicSocialSignIn
            key={provider}
            provider={provider}
            disabled={loading !== null}
            onError={setErrorMessage}
          />
        ) : (
          <OAuthFallbackButton
            key={provider}
            provider={provider}
            loading={loading}
            setLoading={setLoading}
            setErrorMessage={setErrorMessage}
          />
        )
      )}

      {errorMessage && (
        <p className="text-center text-sm text-danger" role="alert">
          {errorMessage}
        </p>
      )}

      {showLater && (
        <div className="space-y-3 pt-1">
          <Button
            variant="ghost"
            className="h-10 w-full text-sm font-medium text-text-3"
            onClick={() => {
              setOpen(false);
              onLater?.();
            }}
            disabled={loading !== null}
          >
            {t("later")}
          </Button>
          {/* Reassurance — the work is KEPT, never discarded (F4). */}
          <p className="text-center text-xs text-text-3">
            {t("progressSavedLocally")}
          </p>
        </div>
      )}
    </div>
  );
}
