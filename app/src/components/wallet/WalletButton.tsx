"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useCallback, useEffect, useState } from "react";

export function WalletButton() {
  const { publicKey, connected, disconnect, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();
  const [linked, setLinked] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const supabase = createClient();

  // When wallet connects and user is already signed in, link the wallet
  const linkWallet = useCallback(async () => {
    if (!user || !publicKey) return;

    const walletAddress = publicKey.toBase58();

    const { data: existing } = await supabase
      .from("linked_wallets")
      .select("id")
      .eq("user_id", user.id)
      .eq("wallet_address", walletAddress)
      .single();

    if (!existing) {
      const { data: wallets } = await supabase
        .from("linked_wallets")
        .select("id")
        .eq("user_id", user.id);

      const isPrimary = !wallets || wallets.length === 0;

      await supabase.from("linked_wallets").insert({
        user_id: user.id,
        wallet_address: walletAddress,
        is_primary: isPrimary,
      });
    }

    setLinked(true);
  }, [user, publicKey, supabase]);

  // When wallet connects and user is NOT signed in, offer wallet-based auth
  const signInWithWallet = useCallback(async () => {
    if (!publicKey || !signMessage || user) return;

    setSigningIn(true);
    try {
      const walletAddress = publicKey.toBase58();
      const message = `Sign in to Caminho.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encodedMessage);

      // Convert to bs58
      const bs58 = await import("bs58");
      const signature = bs58.default.encode(signatureBytes);

      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature, message }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Wallet sign-in failed");
      }

      if (!data.success || !data.email || !data.password) {
        throw new Error("Invalid wallet auth response");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }
      // AuthProvider listener handles session propagation.
    } catch (error) {
      console.error("Wallet sign-in failed:", error);
    } finally {
      setSigningIn(false);
    }
  }, [publicKey, signMessage, user, supabase]);

  useEffect(() => {
    if (connected && publicKey) {
      if (user) {
        linkWallet();
      }
      // We don't auto-trigger signInWithWallet -- the user clicks a button
    } else {
      setLinked(false);
    }
  }, [connected, publicKey, user, linkWallet]);

  // Not connected -- show connect button
  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white rounded-full text-xs font-semibold hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
        Connect Wallet
      </button>
    );
  }

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-full text-xs font-medium text-neutral-700">
        {linked && (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        )}
        <span className="font-mono">{shortAddress}</span>
      </div>

      {/* If wallet is connected but user is not signed in, offer wallet sign-in */}
      {!user && (
        <button
          onClick={signInWithWallet}
          disabled={signingIn}
          className="px-3 py-1.5 bg-neutral-900 text-white rounded-full text-[10px] font-semibold hover:bg-neutral-700 transition-all disabled:opacity-50"
        >
          {signingIn ? "Signing..." : "Sign in with wallet"}
        </button>
      )}

      <button
        onClick={disconnect}
        className="text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors font-medium"
      >
        Disconnect
      </button>
    </div>
  );
}
