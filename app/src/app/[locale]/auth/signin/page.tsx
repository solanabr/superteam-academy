"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Github, Mail, Wallet, Loader2 } from "lucide-react";

export default function SignInPage() {
  const t = useTranslations("auth");
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const [signingIn, setSigningIn] = useState(false);
  const pendingWalletSignIn = useRef(false);

  const handleWalletSign = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;

    setSigningIn(true);
    try {
      const message = `Sign in to Superteam Academy\nTimestamp: ${Date.now()}\nAddress: ${wallet.publicKey.toBase58()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await wallet.signMessage(encodedMessage);

      await signIn("solana-wallet", {
        publicKey: wallet.publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        redirectTo: "/",
      });
    } catch {
      // User rejected signing
    } finally {
      setSigningIn(false);
      pendingWalletSignIn.current = false;
    }
  }, [wallet]);

  useEffect(() => {
    if (
      pendingWalletSignIn.current &&
      wallet.connected &&
      wallet.publicKey &&
      wallet.signMessage
    ) {
      handleWalletSign();
    }
  }, [wallet.connected, wallet.publicKey, handleWalletSign]);

  const handleConnectWallet = () => {
    if (wallet.connected && wallet.publicKey && wallet.signMessage) {
      handleWalletSign();
    } else {
      pendingWalletSignIn.current = true;
      setWalletModalVisible(true);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("signInTitle")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              {t("or")}
            </span>
          </div>

          <Button
            variant="default"
            className="w-full justify-start gap-3 h-12"
            onClick={handleConnectWallet}
            disabled={signingIn}
          >
            {signingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Wallet className="h-5 w-5" />
            )}
            {signingIn
              ? t("signingIn")
              : wallet.connected
                ? t("signInWithWallet")
                : t("connectWallet")}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            {t("termsNotice")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
