"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { GithubLogo, Envelope } from "@phosphor-icons/react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GoogleLogo } from "@/components/icons/google-logo";
import { SolanaLogo } from "@/components/icons/solana-logo";
import { createClient } from "@/lib/supabase/client";
import { buildOAuthRedirect } from "@/lib/auth/oauth-redirect";
import { trackEvent } from "@/lib/analytics";
import { isDynamicEnabled } from "@/lib/dynamic/config";

interface AuthModalProps {
  trigger?: React.ReactNode;
  /**
   * Controlled open state. Pass together with `onOpenChange` to drive the
   * modal programmatically (e.g. an anonymous Enroll click, #556). When
   * controlled and no `trigger` is given, no trigger button is rendered.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Claim-moment mode (LX-A4b): the learner just did the work and is being asked
   * to sign in to keep it. Shows the "keep your progress" framing plus a "Later"
   * escape that dismisses without ever implying the work is lost — it stays
   * banked locally (F4: never "discard progress").
   */
  showLater?: boolean;
  onLater?: () => void;
}

export function AuthModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
  showLater = false,
  onLater,
}: AuthModalProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [loading, setLoading] = useState<"solana" | "google" | "github" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // `useDynamicContext` is safe to call unconditionally: with no environment id
  // the provider renders children straight through, and the hook falls back to
  // its default context rather than throwing.
  const { setShowAuthFlow } = useDynamicContext();
  const dynamicEnabled = isDynamicEnabled();
  const { setVisible } = useWalletModal();

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
    // Brief loading state, then hand off to wallet adapter modal
    setTimeout(() => {
      setOpen(false);
      setLoading(null);
      setTimeout(() => setVisible(true), 200);
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

  /**
   * Dynamic — the no-wallet path, offered FIRST because it is the only option
   * that asks nothing of a learner who has never held a wallet: they sign in
   * with an email or social account and Dynamic provisions a real Solana wallet
   * for them.
   *
   * This only OPENS Dynamic's auth flow. Everything after — the wallet
   * appearing, the SIWS signature, the Supabase session — is handled by
   * `DynamicAuthHandler` at the layout level, because the wallet can also
   * arrive from a restored session with no modal involved. `loading` is reset
   * as soon as the flow is open: leaving it set would keep the Dialog's close
   * guard engaged and strand a learner who dismissed Dynamic's own modal.
   */
  const handleConnectDynamic = () => {
    setErrorMessage(null);
    trackEvent("auth_method_selected", { method: "dynamic" });
    setShowAuthFlow(true);
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          setOpen(v);
          if (!v) setErrorMessage(null);
        }
      }}
    >
      {(trigger !== undefined || !isControlled) && (
        <DialogTrigger asChild>
          {trigger ?? <Button variant="push">{tCommon("signIn")}</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {t(showLater ? "keepProgressTitle" : "signInTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(showLater ? "keepProgressSubtitle" : "signInSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-3">
          {/* First: the only option that asks nothing of a learner with no
              wallet. Hidden entirely when no environment id is configured. */}
          {dynamicEnabled && (
            <div className="space-y-1.5">
              <Button
                variant="push"
                className="h-12 w-full gap-3 text-sm font-medium"
                onClick={handleConnectDynamic}
                disabled={loading !== null}
              >
                <Envelope size={20} weight="fill" aria-hidden="true" />
                {t("continueWithEmail")}
              </Button>
              <p className="text-center text-xs text-text-3">
                {t("emailWalletSubtitle")}
              </p>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
}
