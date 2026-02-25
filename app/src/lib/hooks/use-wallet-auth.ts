"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { buildSignInMessage } from "@/lib/auth/message";

export type WalletAuthState = "idle" | "signing" | "authenticated" | "error";

export function useWalletAuth() {
  const { publicKey, connected, signMessage } = useWallet();
  const { data: session } = useSession();
  const [state, setState] = useState<WalletAuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const prevPubkey = useRef<string | null>(null);

  // Session already has this wallet authenticated
  const isAuthenticated =
    session?.user?.id === publicKey?.toBase58() && connected;

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage || !connected) return;

    setState("signing");
    setError(null);

    try {
      // 1. Fetch nonce from server
      const nonceRes = await fetch("/api/auth/nonce");
      if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
      const { nonce } = await nonceRes.json();

      // 2. Build and sign the message
      const message = buildSignInMessage(nonce);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signatureB64 = Buffer.from(signatureBytes).toString("base64");

      // 3. Authenticate with NextAuth
      const result = await signIn("solana-wallet", {
        redirect: false,
        wallet: publicKey.toBase58(),
        signature: signatureB64,
        message,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setState("authenticated");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Wallet authentication failed";
      // User rejected the signature request — not a real error
      if (msg.includes("User rejected")) {
        setState("idle");
        return;
      }
      console.error("[wallet-auth]", msg);
      setError(msg);
      setState("error");
    }
  }, [publicKey, signMessage, connected]);

  // Track wallet changes — reset auth state when pubkey changes
  useEffect(() => {
    const currentPubkey = publicKey?.toBase58() ?? null;
    if (currentPubkey !== prevPubkey.current) {
      prevPubkey.current = currentPubkey;
      if (currentPubkey && state === "authenticated") {
        setState("idle");
      }
    }
  }, [publicKey, state]);

  // Sign out of NextAuth when wallet disconnects
  useEffect(() => {
    if (!connected && session?.user?.id) {
      signOut({ redirect: false });
      setState("idle");
    }
  }, [connected, session]);

  return {
    state,
    error,
    isAuthenticated,
    authenticate,
  };
}
