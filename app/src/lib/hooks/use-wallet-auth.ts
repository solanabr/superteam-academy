"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { buildSignInMessage } from "@/lib/auth/message";

export type WalletAuthState = "idle" | "signing" | "authenticated" | "error";

export function useWalletAuth() {
  const { publicKey, connected, signMessage, disconnect } = useWallet();
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<WalletAuthState>("idle");
  const [error, setError] = useState<string | null>(null);
  const authAttempted = useRef(false);
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

  // Auto-authenticate when wallet connects (if not already authenticated)
  useEffect(() => {
    const currentPubkey = publicKey?.toBase58() ?? null;

    // Wallet changed — reset state
    if (currentPubkey !== prevPubkey.current) {
      authAttempted.current = false;
      prevPubkey.current = currentPubkey;
    }

    if (
      connected &&
      publicKey &&
      signMessage &&
      !isAuthenticated &&
      !authAttempted.current &&
      state !== "signing" &&
      sessionStatus !== "loading"
    ) {
      authAttempted.current = true;
      authenticate();
    }
  }, [connected, publicKey, signMessage, isAuthenticated, state, sessionStatus, authenticate]);

  // Sign out of NextAuth when wallet disconnects
  useEffect(() => {
    if (!connected && session?.user?.id) {
      signOut({ redirect: false });
      setState("idle");
      authAttempted.current = false;
    }
  }, [connected, session]);

  return {
    state,
    error,
    isAuthenticated,
    authenticate,
  };
}
