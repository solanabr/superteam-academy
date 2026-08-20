"use client";

import { useTranslations } from "next-intl";
import { GithubLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { createClient } from "@/lib/supabase/client";
import { buildOAuthRedirect } from "@/lib/auth/oauth-redirect";
import { trackEvent } from "@/lib/analytics";
import { isDynamicEnabled } from "@/lib/dynamic/config";
import { getAmbientWallet } from "@/lib/solana/ambient-wallet-store";
import { DynamicSocialSignIn } from "@/components/auth/dynamic-social-sign-in";

export type AuthLoadingMethod = "solana" | "google" | "github" | null;

export interface AuthModalBodyProps {
  loading: AuthLoadingMethod;
  setLoading: (v: AuthLoadingMethod) => void;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  setOpen: (v: boolean) => void;
  showLater: boolean;
  onLater?: () => void;
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
 * AuthModal only renders this once a stack is registered.
 */
export default function AuthModalBody({
  loading,
  setLoading,
  errorMessage,
  setErrorMessage,
  setOpen,
  showLater,
  onLater,
}: AuthModalBodyProps) {
  const t = useTranslations("auth");
  const dynamicEnabled = isDynamicEnabled();

  // Return the learner to the page they signed in from (#619 review): the OAuth
  // callback otherwise always lands on /dashboard, stranding someone mid-lesson
  // — and, post-LX-A4, away from the replay that finishes their banked work. The
  // path-shape guard lives in buildOAuthRedirect (unit-tested); the callback
  // re-sanitizes server-side too.
  const oauthRedirectTo = () =>
    buildOAuthRedirect(window.location.origin, window.location.pathname);

  const handleConnectSolana = () => {
    setLoading("solana");
    trackEvent("auth_method_selected", { method: "solana" });
    // Brief loading state, then hand off to the wallet-select modal of
    // whichever provider stack is live — read at call time from the store,
    // since this body renders outside the stack's React tree.
    setTimeout(() => {
      setOpen(false);
      setLoading(null);
      setTimeout(() => getAmbientWallet()?.openWalletModal(), 200);
    }, 400);
  };

  const handleConnectGitHub = async () => {
    setLoading("github");
    setErrorMessage(null);
    trackEvent("auth_method_selected", { method: "github" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: oauthRedirectTo(),
        },
      });
      if (error) {
        console.error("[AuthModal] GitHub sign-in error:", error.message);
        setErrorMessage(t("githubSignInFailed"));
        setLoading(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("githubSignInFailed");
      console.error("[AuthModal] GitHub sign-in error:", message);
      setErrorMessage(t("githubSignInFailed"));
      setLoading(null);
    }
  };

  const handleConnectGoogle = async () => {
    setLoading("google");
    setErrorMessage(null);
    trackEvent("auth_method_selected", { method: "google" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthRedirectTo(),
        },
      });
      if (error) {
        console.error("[AuthModal] Google sign-in error:", error.message);
        setErrorMessage(t("googleSignInFailed"));
        setLoading(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("googleSignInFailed");
      console.error("[AuthModal] Google sign-in error:", message);
      setErrorMessage(t("googleSignInFailed"));
      setLoading(null);
    }
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

      {/* Google goes through Dynamic when it is configured, so the learner
          also walks away with an embedded wallet; the Supabase OAuth
          button below is the fallback AND the kill switch — unsetting the
          environment id restores it untouched. */}
      {dynamicEnabled ? (
        <DynamicSocialSignIn
          provider="google"
          disabled={loading !== null}
          onError={setErrorMessage}
        />
      ) : (
        <Button
          variant="outline"
          className="h-12 w-full gap-3 text-sm font-medium"
          onClick={handleConnectGoogle}
          disabled={loading !== null}
        >
          {loading === "google" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <GoogleLogo className="h-5 w-5 shrink-0" />
          )}
          {loading === "google" ? t("connecting") : t("signInWithGoogle")}
        </Button>
      )}

      {/* GitHub goes through Dynamic when it is configured, so the learner
          also walks away with an embedded wallet; the Supabase OAuth
          button below is the fallback AND the kill switch — unsetting the
          environment id restores it untouched. */}
      {dynamicEnabled ? (
        <DynamicSocialSignIn
          provider="github"
          disabled={loading !== null}
          onError={setErrorMessage}
        />
      ) : (
        <Button
          variant="outline"
          className="h-12 w-full gap-3 text-sm font-medium"
          onClick={handleConnectGitHub}
          disabled={loading !== null}
        >
          {loading === "github" ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <GithubLogo className="h-5 w-5 shrink-0" weight="fill" />
          )}
          {loading === "github" ? t("connecting") : t("signInWithGitHub")}
        </Button>
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
