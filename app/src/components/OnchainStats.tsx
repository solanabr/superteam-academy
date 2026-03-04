"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { readCnftCredentials, readXpTokenBalance } from "@/lib/solana";

export function OnchainStats() {
  const { publicKey, connected } = useWallet();
  const [xpBalance, setXpBalance] = useState<number | null>(null);
  const [cnft, setCnft] = useState<string>("-");

  useEffect(() => {
    async function load() {
      if (!connected || !publicKey) return;
      const owner = publicKey.toBase58();
      const [xp, cnftPayload] = await Promise.all([
        readXpTokenBalance(owner).catch(() => null),
        readCnftCredentials(owner),
      ]);
      setXpBalance(xp);
      setCnft(cnftPayload.note);
    }

    load();
  }, [connected, publicKey]);

  if (!connected || !publicKey) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
        Connect wallet to see on-chain data.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm shadow-sm">
      <div className="font-semibold">On-chain (devnet)</div>
      <div className="mt-2 text-zinc-600">XP token balance: {xpBalance ?? "N/A"}</div>
      <div className="mt-1 text-zinc-600">cNFT credentials: {cnft}</div>
    </div>
  );
}
