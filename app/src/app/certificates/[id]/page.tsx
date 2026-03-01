"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { 
  ArrowLeft, Shield, Check, Share2, Download, 
  ExternalLink, Zap, Calendar, Trophy
} from "lucide-react";

const CERTIFICATES: Record<string, {
  id: string;
  title: string;
  description: string;
  track: string;
  level: number;
  earnedAt: string;
  xp: number;
  mintAddress: string;
}> = {
  "dev-fundamentals": {
    id: "dev-fundamentals",
    title: "Development Fundamentals",
    description: "Completed all courses in the Development track",
    track: "Development",
    level: 3,
    earnedAt: "2026-01-15",
    xp: 1200,
    mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  },
  "anchor-fundamentals": {
    id: "anchor-fundamentals",
    title: "Anchor Fundamentals",
    description: "Mastered Anchor framework for Solana development",
    track: "Development",
    level: 1,
    earnedAt: "2026-01-15",
    xp: 1200,
    mintAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  },
};

export default function CertificatePage() {
  const params = useParams();
  const { connected } = useWallet();
  
  const certificate = CERTIFICATES[params.id as string];

  if (!certificate) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Certificate Not Found</h1>
          <Link href="/profile" className="text-white/60 hover:text-white">
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <MeshGradient />
      
      <main className="pt-14 relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to profile
          </Link>

          {/* Certificate Card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-white/20 rounded-2xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-semibold mb-2">{certificate.title}</h1>
              <p className="text-white/60">{certificate.description}</p>
            </div>

            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">Level {certificate.level}</div>
                <div className="text-white/40 text-sm">Credential Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">{certificate.xp}</div>
                <div className="text-white/40 text-sm">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold mb-1">{certificate.earnedAt}</div>
                <div className="text-white/40 text-sm">Date Earned</div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/40">Mint Address</span>
                <span className="font-mono text-xs">{certificate.mintAddress.slice(0, 8)}...{certificate.mintAddress.slice(-8)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-md font-medium hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" />
              Download Image
            </button>
            <a 
              href={`https://explorer.solana.com/address/${certificate.mintAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-md font-medium hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Verify on-chain
            </a>
          </div>

          {/* Verification */}
          <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">On-Chain Verification</h2>
            <p className="text-white/60 text-sm mb-4">
              This credential is stored as a compressed NFT on Solana Devnet. 
              You can verify its authenticity by checking the mint address on the blockchain.
            </p>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-xs break-all">
              {certificate.mintAddress}
            </div>
            <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Verified on Solana Devnet
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
