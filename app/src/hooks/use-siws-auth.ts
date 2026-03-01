"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState } from "react";
import bs58 from "bs58";
import { buildSiwsMessage } from "@/lib/auth/verify-siws";
import { toast } from "sonner";

export function useSiwsAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const [signing, setSigning] = useState(false);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      toast.error("Wallet not connected or does not support message signing");
      return null;
    }

    setSigning(true);

    try {
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      const domain = window.location.host;
      const issuedAt = new Date().toISOString();
      const message = buildSiwsMessage(
        domain,
        publicKey.toBase58(),
        nonce,
        issuedAt,
      );

      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = await signMessage(msgBytes);
      const signature = bs58.encode(sigBytes);

      return {
        walletAddress: publicKey.toBase58(),
        signature,
        nonce,
        message,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      toast.error(msg);
      return null;
    } finally {
      setSigning(false);
    }
  }, [publicKey, signMessage]);

  return { signIn, signing, connected, publicKey };
}
