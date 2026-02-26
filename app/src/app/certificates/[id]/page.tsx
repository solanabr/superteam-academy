"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Shield,
  CheckCircle2,
  Twitter,
  Copy,
  Zap,
  Award,
  Download,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_CREDENTIAL } from "@/lib/mock-data";
import { formatXP, getLevelColor, getLevelName } from "@/lib/utils/xp";
import { toast } from "sonner";

export default function CertificatePage() {
  const credential = MOCK_CREDENTIAL;
  const levelColor = getLevelColor(credential.level);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const shareOnTwitter = () => {
    const text = `I just earned my "${credential.name}" credential on @SuperteamBR Academy! 🎓⚡ Soulbound NFT on Solana. #Solana #Web3 #LATAM`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto pt-6">

          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Profile
          </Link>

          {/* ─── Certificate Card ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden mb-6"
            style={{
              background: "linear-gradient(145deg, #0d0d18, #12071e, #070d0d)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {/* Gradient top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#00C2FF]" />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#9945FF]/10 blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-60 h-40 bg-[#14F195]/8 blur-[60px] pointer-events-none" />

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#9945FF]/40 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#14F195]/40 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#14F195]/40 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#9945FF]/40 rounded-br-xl" />

            <div className="relative z-10 p-8 sm:p-12">
              {/* Issuer header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center shadow-glow-purple">
                    <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold gradient-text">Superteam Academy</p>
                    <p className="text-[10px] text-muted-foreground tracking-wide uppercase">Official Credential</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#9945FF]/30 bg-[#9945FF]/8 text-xs">
                  <Shield className="h-3 w-3 text-[#9945FF]" />
                  <span className="text-[#9945FF] font-semibold">Soulbound</span>
                </div>
              </div>

              {/* Main credential */}
              <div className="text-center mb-8">
                {/* NFT icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-5"
                >
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl relative"
                    style={{
                      background: `linear-gradient(135deg, ${credential.track.color}20, ${credential.track.color}08)`,
                      border: `1px solid ${credential.track.color}30`,
                      boxShadow: `0 0 40px ${credential.track.color}15`,
                    }}
                  >
                    {credential.track.icon}
                    <div
                      className="absolute -inset-px rounded-2xl opacity-30"
                      style={{
                        background: `conic-gradient(from 0deg, ${credential.track.color}, transparent 30%, transparent 70%, ${credential.track.color})`,
                      }}
                    />
                  </div>
                </motion.div>

                <p className="text-xs text-muted-foreground/70 uppercase tracking-[0.15em] mb-2">
                  This certifies that
                </p>
                <p className="text-base font-bold font-mono text-[#9945FF] mb-2 px-4 py-1.5 rounded-lg inline-block bg-[#9945FF]/8 border border-[#9945FF]/20">
                  {credential.walletAddress}
                </p>
                <p className="text-sm text-muted-foreground mb-3">has successfully completed</p>
                <h1
                  className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #9945FF, #14F195)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {credential.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {credential.track.name} •{" "}
                  <span style={{ color: levelColor }}>{getLevelName(credential.level)} (Level {credential.level})</span>
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: "Courses", value: credential.coursesCompleted },
                  { label: "Total XP", value: `${formatXP(credential.totalXp)}` },
                  { label: "Level", value: credential.level },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="text-center p-3 rounded-xl border"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    <p className="text-lg font-bold gradient-text">{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#14F195]" />
                  Issued {credential.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground/50 truncate max-w-[140px]">
                  {credential.mintAddress}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6"
          >
            <Button asChild variant="glass" size="sm" className="gap-1.5 text-xs">
              <Link
                href={`https://explorer.solana.com/address/${credential.mintAddress}?cluster=devnet`}
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Verify
              </Link>
            </Button>
            <Button variant="glass" size="sm" className="gap-1.5 text-xs" onClick={shareOnTwitter}>
              <Twitter className="h-3.5 w-3.5 text-sky-400" />
              Tweet
            </Button>
            <Button variant="glass" size="sm" className="gap-1.5 text-xs" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>
            <Button variant="glass" size="sm" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </motion.div>

          {/* On-chain details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bento-card p-5"
          >
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-[#9945FF]" />
              On-Chain Details
            </h2>
            <div className="space-y-2.5">
              {[
                { label: "NFT Mint", value: credential.mintAddress },
                { label: "Collection", value: credential.collection },
                { label: "Standard", value: "Metaplex Core (soulbound)" },
                { label: "Network", value: "Solana Devnet" },
                { label: "Metadata URI", value: credential.metadataUri },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 text-xs">
                  <span className="text-muted-foreground/70 shrink-0 font-medium">{label}</span>
                  <span className="font-mono text-right break-all text-muted-foreground/90">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
