"use client";

import { signIn } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Github, Mail, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import bs58 from "bs58";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const t = useTranslations("auth");
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [signingIn, setSigningIn] = useState(false);
  const pendingWalletSignIn = useRef(false);
  const signingRef = useRef(false);

  const handleWalletSign = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;
    if (signingRef.current) return;
    signingRef.current = true;

    setSigningIn(true);
    try {
      const message = `Sign in to Superteam Academy\nTimestamp: ${Date.now()}\nAddress: ${wallet.publicKey.toBase58()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);

      await signIn("solana-wallet", {
        publicKey: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        redirect: false,
      });

      onOpenChange(false);
    } catch {
      // User rejected or error
    } finally {
      setSigningIn(false);
      pendingWalletSignIn.current = false;
      signingRef.current = false;
    }
  }, [wallet, onOpenChange]);

  // Only trigger sign-in when wallet connects after user explicitly clicked "Connect Wallet"
  useEffect(() => {
    if (
      pendingWalletSignIn.current &&
      !signingRef.current &&
      wallet.connected &&
      wallet.publicKey &&
      wallet.signMessage
    ) {
      handleWalletSign();
    }
  }, [wallet.connected, wallet.publicKey, handleWalletSign]);

  const handleWalletSignIn = useCallback(() => {
    if (wallet.connected && wallet.publicKey && wallet.signMessage) {
      handleWalletSign();
    } else {
      pendingWalletSignIn.current = true;
      // Close the dialog first so the wallet modal isn't blocked by the overlay
      onOpenChange(false);
      setWalletModalVisible(true);
    }
  }, [wallet, handleWalletSign, onOpenChange, setWalletModalVisible]);

  // Clean up any leftover body scroll lock from Radix Dialog when the
  // wallet modal takes over or after OAuth redirect completes.
  useEffect(() => {
    if (!open) {
      // Give Radix a tick to clean up, then force-remove scroll lock
      const timer = setTimeout(() => {
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("pointer-events");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t("signInTitle")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("signInDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => signIn("google", { redirectTo: "/" })}
          >
            <Mail className="h-5 w-5" />
            {t("continueWithGoogle")}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => signIn("github", { redirectTo: "/" })}
          >
            <Github className="h-5 w-5" />
            {t("continueWithGitHub")}
          </Button>

          <div className="relative py-2">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              {t("or")}
            </span>
          </div>

          <Button
            variant="default"
            className="w-full justify-start gap-3 h-12"
            onClick={handleWalletSignIn}
            disabled={signingIn}
          >
            <Wallet className="h-5 w-5" />
            {signingIn
              ? t("signingIn")
              : wallet.connected
                ? t("signInWithWallet")
                : t("connectWallet")}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            {t("termsNotice")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
