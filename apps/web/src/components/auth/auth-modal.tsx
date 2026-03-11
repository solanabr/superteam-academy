"use client";

import { useState } from "react";
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
import { trackEvent } from "@/lib/analytics";

interface AuthModalProps {
  trigger?: React.ReactNode;
}

export function AuthModal({ trigger }: AuthModalProps) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"solana" | "google" | "github" | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setVisible } = useWalletModal();

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
          redirectTo: `${window.location.origin}/api/auth/callback`,
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
          redirectTo: `${window.location.origin}/api/auth/callback`,
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
      <DialogTrigger asChild>
        {trigger ?? <Button variant="push">{tCommon("signIn")}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">{t("signInTitle")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("signInSubtitle")}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
