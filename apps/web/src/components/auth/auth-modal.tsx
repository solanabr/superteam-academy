"use client";

import { forwardRef, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { GithubLogo } from "@phosphor-icons/react";
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
import { useSocialReturnPending } from "@/hooks/use-social-return-pending";
import { DynamicSocialSignIn } from "@/components/auth/dynamic-social-sign-in";

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

/**
 * The button that opens the auth modal, with the social-return spinner built
 * in: while the Google/GitHub return handshake runs, the button shows
 * "Signing in…" and disables itself. AuthModal's default trigger; also for
 * custom triggers (the landing hero) that hand-copied this markup before
 * #1077. Forwards ref and props so it works under `DialogTrigger asChild`.
 */
export const AuthTriggerButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button> & { label: string }
>(function AuthTriggerButton({ label, disabled, ...props }, ref) {
  const t = useTranslations("auth");
  const socialReturnPending = useSocialReturnPending();

  return (
    <Button ref={ref} disabled={disabled || socialReturnPending} {...props}>
      {socialReturnPending ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {t("signingIn")}
        </span>
      ) : (
        label
      )}
    </Button>
  );
});

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
  // NOT a Dynamic hook call. Every hook in `@dynamic-labs-sdk/react-hooks`
  // throws `MissingProviderError` when no provider is mounted, so calling one
  // here would crash sign-in in any build without an environment id. Hooks
  // cannot be conditional, so the gate is a component boundary instead:
  // DynamicSocialSignIn owns the hooks and mounts only when Dynamic is enabled.
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
          {/* While the Google-return handshake runs, the trigger button
              carries the loading state — the alternative was a full-screen
              overlay, and the owner preferred the button. */}
          {trigger ?? (
            <AuthTriggerButton variant="push" label={tCommon("signIn")} />
          )}
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
      </DialogContent>
    </Dialog>
  );
}
