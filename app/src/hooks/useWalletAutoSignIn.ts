"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSession, signIn, signOut } from "next-auth/react";
import bs58 from "bs58";

/**
 * Bridges wallet-adapter connection and NextAuth session.
 *
 * - When user connects a wallet and has no session → signs in via NextAuth.
 * - When wallet disconnects and user has a wallet session → signs out.
 * - When session ends (e.g. Google sign-out) → disconnects wallet.
 *
 * autoConnect is OFF on the WalletProvider, so the wallet only connects
 * when the user explicitly picks one from the modal. No localStorage
 * gymnastics needed.
 */
export function useWalletAutoSignIn() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { data: session, status } = useSession();
  const signingIn = useRef(false);
  const prevConnected = useRef(false);

  const performSignIn = useCallback(async () => {
    if (!publicKey || !signMessage || signingIn.current) return;
    signingIn.current = true;
    try {
      const message = `Sign in to Superteam Academy\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);

      const result = await signIn("solana", {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        redirect: false,
      });

      if (result?.ok) {
        window.location.href = "/courses";
      } else {
        // Auth failed — disconnect wallet
        try { await disconnect(); } catch {}
      }
    } catch {
      // User rejected signature — disconnect wallet
      try { await disconnect(); } catch {}
    } finally {
      signingIn.current = false;
    }
  }, [publicKey, signMessage, disconnect]);

  useEffect(() => {
    const justConnected = connected && !prevConnected.current;
    const justDisconnected = !connected && prevConnected.current;
    prevConnected.current = connected;

    // Wallet just connected + no session + user explicitly initiated → sign in
    if (justConnected && publicKey && signMessage && status !== "loading" && !session?.user) {
      if (sessionStorage.getItem("wallet_signin_pending")) {
        sessionStorage.removeItem("wallet_signin_pending");
        void performSignIn();
      }
    }

    // Wallet disconnected + wallet session exists → sign out
    if (justDisconnected && session?.user) {
      void signOut({ callbackUrl: "/" });
    }
  }, [connected, publicKey, signMessage, session, status, performSignIn]);

  // Session ended (Google/GitHub sign-out) + wallet still connected → disconnect
  const prevSession = useRef<boolean>(!!session?.user);
  useEffect(() => {
    const hasSession = !!session?.user;
    const justLostSession = !hasSession && prevSession.current && status !== "loading";
    prevSession.current = hasSession;

    if (justLostSession && connected) {
      void disconnect();
    }
  }, [session, status, connected, disconnect]);
}
