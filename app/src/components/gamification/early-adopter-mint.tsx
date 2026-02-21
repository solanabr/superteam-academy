"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

const EARLY_ADOPTER_IMAGE = "https://i.ibb.co/7xNkX9tB/earlyadopter.jpg";

export function EarlyAdopterMint() {
  const { user, profile } = useAuth();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [minted, setMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(100);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [alreadyMinted, setAlreadyMinted] = useState(false);
  const [soldOut, setSoldOut] = useState(false);

  const walletAddress = profile?.walletAddress ?? publicKey?.toBase58();

  const fetchStatus = useCallback(async () => {
    try {
      const params = user ? `?userId=${user.id}` : "";
      const res = await fetch(`/api/mint/early-adopter${params}`);
      const data = await res.json();
      setMinted(data.minted ?? 0);
      setMaxSupply(data.maxSupply ?? 100);
      setSoldOut((data.minted ?? 0) >= (data.maxSupply ?? 100));
      if (data.userMinted) setAlreadyMinted(true);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleMint = async () => {
    if (!user || !walletAddress || !signTransaction) {
      toast.error("Connect your wallet to mint");
      return;
    }

    setMinting(true);
    try {
      // Step 1: Get partially-signed tx from backend
      const res = await fetch("/api/mint/early-adopter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          walletAddress,
        }),
      });

      const data = await res.json();

      if (data.alreadyMinted) {
        setAlreadyMinted(true);
        toast.info("You already minted your Early Adopter NFT!");
        return;
      }

      if (data.soldOut) {
        setSoldOut(true);
        toast.error("All Early Adopter NFTs have been minted!");
        return;
      }

      if (!res.ok || !data.transaction) {
        throw new Error(data.error ?? "Failed to prepare transaction");
      }

      // Step 2: Sign with wallet (user pays tx fee + rent)
      const tx = VersionedTransaction.deserialize(
        Buffer.from(data.transaction, "base64"),
      );
      const signedTx = await signTransaction(tx);

      // Step 3: Send and confirm
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature, "confirmed");

      // Step 4: Record in Supabase
      await fetch("/api/mint/early-adopter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          walletAddress,
          action: "confirm",
          signature,
          assetAddress: data.assetAddress,
        }),
      });

      setAlreadyMinted(true);
      setMinted(data.minted ?? minted + 1);

      toast.success("Early Adopter NFT minted!", {
        description: `NFT ${data.assetAddress?.slice(0, 8)}...`,
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
      setMinting(false);
    }
  };

  const isSoldOut = soldOut || minted >= maxSupply;

  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-all hover:border-amber-500/30">
      {/* Thumbnail */}
      <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
        <Image
          src={EARLY_ADOPTER_IMAGE}
          alt="Early Adopter NFT"
          fill
          className="object-cover"
          sizes="40px"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <p className="font-medium text-sm truncate">Early Adopter NFT</p>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {loading ? "..." : `${minted}/${maxSupply} minted`} · +100 XP
        </p>
      </div>

      {/* Action */}
      {alreadyMinted ? (
        <Badge variant="secondary" className="text-xs gap-1 shrink-0 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Minted
        </Badge>
      ) : isSoldOut ? (
        <Badge variant="secondary" className="text-xs shrink-0">
          Sold out
        </Badge>
      ) : (
        <Button
          size="sm"
          onClick={handleMint}
          disabled={minting || !walletAddress || loading}
          className="shrink-0 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs h-8 px-3"
        >
          {minting ? "Minting..." : "Mint"}
        </Button>
      )}
    </div>
  );
}
