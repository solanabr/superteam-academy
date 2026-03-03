"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Award } from "lucide-react";
import { CredentialCard } from "@/components/solana/CredentialCard";
import { getCredentials } from "@/services/credentials";
import type { Credential } from "@/types";

export default function CertificatesPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) return;
    setLoading(true);
    getCredentials(publicKey.toBase58())
      .then(setCredentials)
      .catch(() => setCredentials([]))
      .finally(() => setLoading(false));
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
        <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center">
          <Award className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-mono text-xl font-bold text-foreground mb-2">
            My Certificates
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your on-chain credentials.
          </p>
        </div>
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-2.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded-full hover:bg-[#0D9E61] transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-foreground mb-1">
          My Certificates
        </h1>
        <p className="text-sm text-muted-foreground">
          Soulbound credentials issued on-chain via Metaplex Core.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded h-48 animate-pulse"
            />
          ))}
        </div>
      ) : credentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center">
            <Award className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            No credentials yet.
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Complete a course to earn your first soulbound credential NFT.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {credentials.map((cred) => (
            <CredentialCard key={cred.id} credential={cred} />
          ))}
        </div>
      )}
    </div>
  );
}
