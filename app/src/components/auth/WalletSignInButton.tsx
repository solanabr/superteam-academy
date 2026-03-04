"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WalletSignInButtonProps {
  mode?: "signin" | "signup";
}

export function WalletSignInButton({ mode = "signin" }: WalletSignInButtonProps) {
  const { publicKey, connected, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        console.log("Auth state: SIGNED_IN");
        router.push("/dashboard");
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleWalletAuth = async () => {
    if (!connected || !publicKey || !signMessage) {
      setVisible(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletAddress = publicKey.toBase58();
      const timestamp = Date.now();
      const message = `Sign ${mode === "signin" ? "in" : "up"} to Caminho.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      console.log("Signing message:", message);
      const signatureBytes = await signMessage(encodedMessage);

      const bs58 = await import("bs58");
      const signature = bs58.default.encode(signatureBytes);

      console.log("Sending auth request...");
      const response = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, signature, message }),
      });

      const data = await response.json();
      console.log("Auth response:", data);

      if (!response.ok) {
        console.error("API error:", data.error);
        throw new Error(data.error || "Authentication failed");
      }

      console.log("Auth successful, signing in with:", data.email);

      if (data.success && data.email && data.password) {
        // Sign in with the returned credentials
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          console.error("Sign in error:", signInError);
          throw new Error(signInError.message);
        }

        // Auth state listener will handle the redirect
        console.log("Sign in successful, waiting for auth state change...");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: unknown) {
      console.error("Wallet auth error:", err);
      setError(err instanceof Error ? err.message : "Wallet authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2 font-medium">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleWalletAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[#9945FF] to-[#14F195] rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all duration-300 shadow-sm disabled:opacity-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
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
        {loading 
          ? "Connecting..." 
          : connected 
            ? `Continue with ${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`
            : mode === "signin" 
              ? "Sign in with Wallet" 
              : "Sign up with Wallet"
        }
      </button>
    </div>
  );
}
