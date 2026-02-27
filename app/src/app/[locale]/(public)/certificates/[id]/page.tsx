import { getTranslations } from "next-intl/server";
import { ExternalLink, Share2, Shield } from "lucide-react";
import { solanaExplorerUrl } from "@/lib/solana";
import { TRACKS } from "@/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Academy Certificate · ${id.slice(0, 8)}...`,
    description: "Verified Solana developer credential issued on-chain.",
  };
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("certificate");

  // In production: fetch from Helius DAS by asset address (id)
  const mockCredential = {
    name: "Solana Basics",
    trackId: 1,
    level: "1",
    coursesCompleted: "3",
    totalXp: "2500",
    earnedBy: `${id.slice(0, 4)}...${id.slice(-4)}`,
    completedOn: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    assetAddress: id,
  };

  const track = TRACKS[mockCredential.trackId];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Certificate card */}
      <div className="relative bg-[#0D0D0D] border border-[#14F195]/30 rounded-lg overflow-hidden p-8">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(20,241,149,0.08) 0%, transparent 60%)",
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#14F195]/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#14F195]/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#14F195]/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#14F195]/50 rounded-br-lg" />

        <div className="relative z-10 text-center space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-[#14F195]" />
              <span className="text-[10px] font-mono text-[#14F195] uppercase tracking-[0.2em]">
                {t("verified")}
              </span>
            </div>
            <h1 className="font-mono text-2xl font-black text-[#EDEDED] tracking-widest uppercase">
              Academy Certificate
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1F1F1F]" />
            <span className="text-[#14F195] text-lg">◎</span>
            <div className="flex-1 h-px bg-[#1F1F1F]" />
          </div>

          {/* Main content */}
          <div className="py-4 space-y-2">
            <p className="text-xs text-[#666666] font-mono uppercase tracking-wider">This certifies that</p>
            <p className="font-mono text-xl font-bold text-[#14F195]">{mockCredential.earnedBy}</p>
            <p className="text-xs text-[#666666] font-mono">has successfully completed</p>
            <p className="font-mono text-2xl font-black text-[#EDEDED]">{mockCredential.name}</p>
            {track && (
              <p className="text-sm text-[#666666] font-mono">
                {track.icon} {track.name} Track · Level {mockCredential.level}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 py-3 border-y border-[#1F1F1F]">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[#EDEDED]">
                {mockCredential.coursesCompleted}
              </div>
              <div className="text-[9px] text-[#666666] font-mono uppercase tracking-wider">
                Courses
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[#14F195]">
                {Number(mockCredential.totalXp).toLocaleString()}
              </div>
              <div className="text-[9px] text-[#666666] font-mono uppercase tracking-wider">
                XP Earned
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[#EDEDED]">
                {mockCredential.level}
              </div>
              <div className="text-[9px] text-[#666666] font-mono uppercase tracking-wider">
                Level
              </div>
            </div>
          </div>

          <p className="text-xs text-[#666666] font-mono">
            {t("completedOn", { date: mockCredential.completedOn })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <a
          href={solanaExplorerUrl(id)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#1F1F1F] text-[#666666] hover:text-[#EDEDED] hover:border-[#2E2E2E] font-mono text-sm rounded transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("viewOnExplorer")}
        </a>
        <CopyShareButton url={`https://academy.superteam.fun/certificates/${id}`} label={t("share")} />
      </div>

      {/* On-chain details */}
      <div className="mt-6 bg-[#111111] border border-[#1F1F1F] rounded p-4 space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-[#666666]">Asset Address</span>
          <span className="text-[#EDEDED] break-all">{id.slice(0, 20)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666666]">Program</span>
          <span className="text-[#EDEDED]">ACADBRCB3...3ucf</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666666]">Network</span>
          <span className="text-[#14F195]">Solana Devnet</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#666666]">Standard</span>
          <span className="text-[#EDEDED]">Metaplex Core (Soulbound)</span>
        </div>
      </div>
    </div>
  );
}

// Client component for clipboard copy
function CopyShareButton({ url, label }: { url: string; label: string }) {
  return (
    <button
      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-[#0D9E61] transition-colors"
      onClick={() => {
        if (typeof window !== "undefined") {
          navigator.clipboard.writeText(url).catch(() => {});
        }
      }}
    >
      <Share2 className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
