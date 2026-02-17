"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IdentitySnapshot } from "@/lib/identity/types";
import { sendInitLearner } from "@/lib/solana/init-learner";

type Props = {
  identity: IdentitySnapshot;
  onInitialized?: () => void;
};

export function OnChainLearnerCard({ identity, onInitialized }: Props) {
  const { publicKey, sendTransaction } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const hasLearner = identity.chain.hasLearnerProfile;

  if (hasLearner) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm font-medium">
            On-chain learner profile is active.
          </p>
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-300"
          >
            {identity.chain.cluster}
          </Badge>
        </div>
      </div>
    );
  }

  async function handleInitialize() {
    if (!publicKey || !sendTransaction) {
      setStatusError("Connect a wallet that supports transactions.");
      return;
    }
    if (publicKey.toBase58() !== identity.profile.walletAddress) {
      setStatusError(
        "Connected wallet does not match the authenticated wallet.",
      );
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    setStatusError(null);
    try {
      const signature = await sendInitLearner(
        sendTransaction,
        identity.profile.walletAddress,
      );
      setStatusMessage(
        `Learner profile initialized. Tx: ${signature.slice(0, 8)}...`,
      );
      onInitialized?.();
      window.setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize on-chain learner.";
      setStatusError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Initialize on-chain learner profile
            </p>
            <Badge variant="outline" className="border-primary/40 text-primary">
              {identity.chain.cluster}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Required once per wallet to store XP, level, and streak directly
            on-chain.
          </p>
        </div>
        <Button
          onClick={handleInitialize}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? "Initializing..." : "Initialize Learner"}
        </Button>
      </div>

      {statusMessage ? (
        <p className="mt-3 text-xs text-emerald-400">{statusMessage}</p>
      ) : null}
      {statusError ? (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{statusError}</span>
        </div>
      ) : null}
    </div>
  );
}
