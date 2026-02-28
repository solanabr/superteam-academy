"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ExternalLink, Download, Twitter, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;

  const mockCredential = {
    name: "Solana Fundamentals — Track Credential",
    recipient: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    track: "SOLANA_FUNDAMENTALS",
    level: 3,
    coursesCompleted: 2,
    totalXp: 2400,
    issuedAt: "2025-01-15",
    mintAddress: id,
    collection: "ACADBRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  };

  return (
    <div className="min-h-screen bg-[#020202]">
      <div className="border-b border-[#1a1a1a] px-6 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">
            // ON_CHAIN_CREDENTIAL
          </span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          
          <a  href={`https://explorer.solana.com/address/${id}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest"
          >
            VERIFY_ON_CHAIN
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <h1 className="font-display font-black text-5xl uppercase tracking-tighter">
          CREDENTIAL <span className="text-[#9945ff]">NFT</span>
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#1a1a1a]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#020202] p-8"
          >
            <div className="border border-[#9945ff]/30 p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: "repeating-linear-gradient(0deg, #9945ff, #9945ff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #9945ff, #9945ff 1px, transparent 1px, transparent 40px)",
                }} />
              </div>
              <div className="relative">
                <div className="text-[10px] font-mono text-[#9945ff] uppercase tracking-widest mb-8">
                  SUPERTEAM_ACADEMY // DEVNET
                </div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                  THIS_CERTIFIES_THAT
                </div>
                <div className="font-display font-black text-2xl uppercase tracking-tight text-[#f5f5f0] mb-6">
                  {mockCredential.recipient.slice(0, 8)}...{mockCredential.recipient.slice(-8)}
                </div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-widest mb-2">
                  HAS_COMPLETED
                </div>
                <div className="font-display font-black text-3xl uppercase tracking-tight text-[#9945ff] mb-8">
                  {mockCredential.track}
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-[#1a1a1a] pt-6">
                  <div>
                    <div className="text-[10px] font-mono text-[#333] mb-1">LEVEL</div>
                    <div className="text-xl font-black font-display text-[#14f195]">{mockCredential.level}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#333] mb-1">COURSES</div>
                    <div className="text-xl font-black font-display text-[#f5f5f0]">{mockCredential.coursesCompleted}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#333] mb-1">TOTAL_XP</div>
                    <div className="text-xl font-black font-display text-[#9945ff]">{mockCredential.totalXp.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#14f195]">
                    <CheckCircle className="w-3 h-3" />
                    SOULBOUND // METAPLEX_CORE // ON_CHAIN
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="bg-[#020202] p-8 space-y-6">
            <div>
              <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-6">
                // NFT_DETAILS
              </div>
              <div className="space-y-3">
                {[
                  { label: "CREDENTIAL_NAME", value: mockCredential.name },
                  { label: "TRACK", value: mockCredential.track },
                  { label: "LEVEL", value: `LVL_${mockCredential.level}` },
                  { label: "COURSES_COMPLETED", value: mockCredential.coursesCompleted.toString() },
                  { label: "TOTAL_XP", value: `${mockCredential.totalXp.toLocaleString()}_XP` },
                  { label: "ISSUED", value: mockCredential.issuedAt },
                  { label: "MINT_ADDRESS", value: `${id.slice(0, 8)}...${id.slice(-8)}` },
                  { label: "STANDARD", value: "METAPLEX_CORE" },
                  { label: "TYPE", value: "SOULBOUND_NFT" },
                  { label: "NETWORK", value: "SOLANA_DEVNET" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between py-2 border-b border-[#1a1a1a]">
                    <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">{item.label}</span>
                    <span className="text-[10px] font-mono text-[#f5f5f0] text-right max-w-[200px] break-all">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              
               <a href={`https://explorer.solana.com/address/${id}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors"
              >
                VERIFY_ON_SOLANA_EXPLORER
                <ExternalLink className="w-3 h-3" />
              </a>
              <button className="flex items-center justify-center gap-2 w-full py-3 border border-[#1a1a1a] text-[#444] font-mono text-[10px] uppercase tracking-widest hover:border-[#333] hover:text-[#f5f5f0] transition-colors">
                <Twitter className="w-3 h-3" />
                SHARE_ON_TWITTER
              </button>
              <button className="flex items-center justify-center gap-2 w-full py-3 border border-[#1a1a1a] text-[#444] font-mono text-[10px] uppercase tracking-widest hover:border-[#333] hover:text-[#f5f5f0] transition-colors">
                <Download className="w-3 h-3" />
                DOWNLOAD_IMAGE
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/dashboard" className="text-[10px] font-mono text-[#444] hover:text-[#9945ff] transition-colors uppercase tracking-widest">
            ← BACK_TO_DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
}