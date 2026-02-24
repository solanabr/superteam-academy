"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface MintableAchievement {
  id: string;
  name: string;
  iconUrl: string;
  xpReward: number;
  requirement: string;
}

export function AchievementMintList() {
  const { user, profile } = useAuth();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [mintable, setMintable] = useState<MintableAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [mintingId, setMintingId] = useState<string | null>(null);

  // Always use the linked wallet for data queries — never the connected wallet
  const linkedWallet = profile?.walletAddress ?? null;

  const fetchMintable = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let params = `?userId=${user.id}`;
      if (linkedWallet) params += `&wallet=${linkedWallet}`;
      const res = await fetch(`/api/mint/achievement${params}`);
      const data = await res.json();
      setMintable(data.mintable ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [user, linkedWallet]);

  useEffect(() => {
    fetchMintable();
  }, [fetchMintable]);

  const handleMint = async (achievement: MintableAchievement) => {
    if (!user || !linkedWallet) {
      toast.error("Link a wallet in Settings to mint achievements");
      return;
    }
    if (!signTransaction || !publicKey) {
      toast.error("Connect your linked wallet to sign the transaction");
      return;
    }
    if (publicKey.toBase58() !== linkedWallet) {
      toast.error("Please connect the wallet linked to your account to mint");
      return;
    }

    setMintingId(achievement.id);
    try {
      // Step 1: Get partially-signed tx from backend
      const res = await fetch("/api/mint/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementId: achievement.id,
          userId: user.id,
          walletAddress: linkedWallet,
        }),
      });

      const data = await res.json();

      if (data.alreadyMinted) {
        setMintable((prev) => prev.filter((a) => a.id !== achievement.id));
        toast.info(`You already minted ${achievement.name}!`);
        return;
      }

      if (data.soldOut) {
        setMintable((prev) => prev.filter((a) => a.id !== achievement.id));
        toast.error(`${achievement.name} is sold out!`);
        return;
      }

      if (data.notEligible) {
        setMintable((prev) => prev.filter((a) => a.id !== achievement.id));
        toast.error(data.error ?? "Not eligible");
        return;
      }

      if (!res.ok || !data.transaction) {
        throw new Error(data.error ?? "Failed to prepare transaction");
      }

      // Step 2: Sign with wallet
      const tx = VersionedTransaction.deserialize(
        Buffer.from(data.transaction, "base64"),
      );
      const signedTx = await signTransaction(tx);

      // Step 3: Send and confirm
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: false, maxRetries: 3 },
      );
      await connection.confirmTransaction(signature, "confirmed");

      // Step 4: Record in DB
      await fetch("/api/mint/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementId: achievement.id,
          userId: user.id,
          walletAddress: linkedWallet,
          action: "confirm",
          signature,
          assetAddress: data.assetAddress,
        }),
      });

      // Remove from list
      setMintable((prev) => prev.filter((a) => a.id !== achievement.id));

      // Signal XP changed so dashboard stats refresh immediately
      window.dispatchEvent(new Event("xp-updated"));

      toast.success(`${achievement.name} minted!`, {
        description: `+${achievement.xpReward} XP · ${data.assetAddress?.slice(0, 8)}...`,
        action: {
          label: "View TX",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
              "_blank",
            ),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("User rejected")) {
        toast.info("Transaction cancelled");
        return;
      }
      toast.error("Mint failed", { description: message });
    } finally {
      setMintingId(null);
    }
  };

  if (loading || mintable.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        Achievements Available to Mint
      </h2>
      <div className="space-y-2">
        {mintable.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-all hover:border-amber-500/30"
          >
            <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
              <Image
                src={achievement.iconUrl}
                alt={achievement.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="font-medium text-sm truncate">
                  {achievement.name}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {achievement.requirement} · +{achievement.xpReward} XP
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => handleMint(achievement)}
              disabled={
                mintingId !== null || !linkedWallet
              }
              className="shrink-0 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8 px-3"
            >
              {mintingId === achievement.id ? "Minting..." : "Mint"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
