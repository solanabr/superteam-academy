"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, Wallet } from "lucide-react";
import { GitHubIcon } from "@/components/icons/github-icon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function AuthDialog({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("auth");
  const {
    isAuthenticated,
    signInWithGoogle,
    signInWithGithub,
    signInWithWallet,
  } = useAuth();
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const pendingSignIn = useRef(false);

  // Auto-trigger sign-in after wallet connects via modal
  // This effect lives in AuthDialog (always mounted), not in DialogContent
  useEffect(() => {
    if (connected && pendingSignIn.current) {
      pendingSignIn.current = false;
      setIsSigningIn(true);
      signInWithWallet()
        .catch((err) => console.error("Wallet sign-in failed:", err))
        .finally(() => setIsSigningIn(false));
    }
  }, [connected, signInWithWallet]);

  const handleWalletClick = useCallback(async () => {
    if (!connected) {
      pendingSignIn.current = true;
      // Close auth dialog so its overlay doesn't block the wallet modal
      setOpen(false);
      setTimeout(() => setVisible(true), 100);
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithWallet();
    } catch (err) {
      console.error("Wallet sign-in failed:", err);
    } finally {
      setIsSigningIn(false);
    }
  }, [connected, signInWithWallet, setVisible]);

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        {children}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="h-9">
            {t("signIn")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("signIn")}</DialogTitle>
          <DialogDescription>
            Choose how you want to sign in to Superteam Academy.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            variant="outline"
            className="h-11 justify-start gap-3 font-normal"
            onClick={async () => {
              await signInWithGoogle();
              setOpen(false);
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("signInWith")} Google
          </Button>

          <Button
            variant="outline"
            className="h-11 justify-start gap-3 font-normal"
            onClick={async () => {
              await signInWithGithub();
              setOpen(false);
            }}
          >
            <GitHubIcon className="h-4 w-4" />
            {t("signInWith")} GitHub
          </Button>

          <Button
            variant="outline"
            className="h-11 justify-start gap-3 font-normal"
            onClick={handleWalletClick}
            disabled={connecting || isSigningIn}
          >
            <Wallet className="h-4 w-4" />
            {connecting || isSigningIn
              ? "Connecting..."
              : connected
                ? `${t("signInWith")} Wallet`
                : "Connect Wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UserMenu() {
  const { signOut, isAuthenticated, profile } = useAuth();
  const t = useTranslations("navigation");

  if (!isAuthenticated) {
    return <AuthDialog />;
  }

  return (
    <div className="flex items-center gap-2">
      {profile?.walletAddress && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {profile.walletAddress.slice(0, 4)}...{profile.walletAddress.slice(-4)}
        </span>
      )}
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4" />
        <span>{t("signOut")}</span>
      </button>
    </div>
  );
}
