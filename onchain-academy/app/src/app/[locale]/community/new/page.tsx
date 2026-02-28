"use client";

import { useEffect } from "react";
import { useWallet } from "@/lib/wallet/context";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NewThreadForm } from "@/components/community/new-thread-form";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { useWalletAuth } from "@/lib/hooks/use-wallet-auth";

export default function NewThreadPage() {
  const { publicKey, connected } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { isAuthenticated, authenticate, state } = useWalletAuth();

  // Auto-trigger auth when wallet is connected but no session
  useEffect(() => {
    if (connected && wallet && !isAuthenticated && state === "idle") {
      authenticate();
    }
  }, [connected, wallet, isAuthenticated, state, authenticate]);

  if (!wallet) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-24 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]">
          <Wallet className="h-8 w-8 text-[var(--c-text-muted)]" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-[var(--c-text)]">
          Wallet Required
        </h1>
        <p className="mb-6 text-sm text-[var(--c-text-2)]">
          Connect your Solana wallet to create a new thread.
        </p>
        <Link href={`/${locale}/community`}>
          <Button variant="outline" size="sm">
            Back to Community
          </Button>
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-24 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)]">
          {state === "signing" ? (
            <Loader2 className="h-8 w-8 text-[var(--c-text-muted)] animate-spin" />
          ) : (
            <Wallet className="h-8 w-8 text-[var(--c-text-muted)]" />
          )}
        </div>
        <h1 className="mb-2 text-lg font-semibold text-[var(--c-text)]">
          {state === "signing" ? "Signing In..." : "Authentication Required"}
        </h1>
        <p className="mb-6 text-sm text-[var(--c-text-2)]">
          {state === "signing"
            ? "Please approve the signature request in your wallet."
            : "Sign in with your wallet to create a new thread."}
        </p>
        {state !== "signing" && (
          <Button size="sm" onClick={authenticate}>
            Sign In
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <NewThreadForm wallet={wallet} />
    </div>
  );
}
