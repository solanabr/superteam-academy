"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useEffect, useRef, useState } from "react";
import bs58 from "bs58";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { Wallet } from "lucide-react";

interface OAuthButtonsProps {
  callbackUrl?: string;
}

export function OAuthButtons({ callbackUrl = "/courses" }: OAuthButtonsProps) {
  const t = useTranslations("auth");
  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [walletLoading, setWalletLoading] = useState(false);
  // After opening wallet modal, auto-sign once the wallet connects
  const pendingSignIn = useRef(false);

  useEffect(() => {
    if (connected && publicKey && signMessage && pendingSignIn.current) {
      pendingSignIn.current = false;
      void performWalletSignIn();
    }
    // Reset pending flag if wallet disconnects (e.g. modal dismissed without connecting)
    if (!connected) {
      pendingSignIn.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, signMessage]);

  async function performWalletSignIn() {
    if (!publicKey || !signMessage) return;
    setWalletLoading(true);
    try {
      const message = `Sign in to Superteam Academy\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);

      await signIn("solana", {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        callbackUrl,
      });
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleWalletSignIn() {
    if (!connected || !publicKey || !signMessage) {
      pendingSignIn.current = true;
      setVisible(true);
      return;
    }
    await performWalletSignIn();
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="h-11 w-full justify-center gap-3 text-sm font-medium"
        onClick={() => signIn("google", { callbackUrl })}
      >
        <GoogleIcon />
        {t("continueWithGoogle")}
      </Button>

      <Button
        variant="outline"
        className="h-11 w-full justify-center gap-3 text-sm font-medium"
        onClick={() => signIn("github", { callbackUrl })}
      >
        <GitHubIcon />
        {t("continueWithGithub")}
      </Button>

      <Button
        variant="outline"
        className="h-11 w-full justify-center gap-3 text-sm font-medium"
        onClick={handleWalletSignIn}
        disabled={walletLoading}
      >
        <Wallet className="h-5 w-5" />
        {walletLoading ? t("connectingWallet") : t("continueWithWallet")}
      </Button>
    </div>
  );
}
