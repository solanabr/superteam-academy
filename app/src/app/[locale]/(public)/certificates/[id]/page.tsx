import { getTranslations } from "next-intl/server";
import { ExternalLink, Share2, Shield } from "lucide-react";
import { solanaExplorerUrl } from "@/lib/solana";
import { TRACKS } from "@/types";
import type { Metadata } from "next";
import { DownloadButton } from "./DownloadButton";

// X (Twitter) logo as inline SVG — no extra dependency needed
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.634 5.903-5.634Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

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

  const certificateUrl = `https://superteam-academy.vercel.app/certificates/${id}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `I just completed the ${mockCredential.name} on @SuperteamBR Academy and earned my on-chain credential! #Solana #Web3 #SuperteamAcademy`
  )}&url=${encodeURIComponent(certificateUrl)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Certificate card */}
      <div className="relative bg-background border border-[#14F195]/30 rounded-lg overflow-hidden p-8">
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
            <h1 className="font-mono text-2xl font-black text-foreground tracking-widest uppercase">
              Academy Certificate
            </h1>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[#14F195] text-lg">◎</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Main content */}
          <div className="py-4 space-y-2">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">This certifies that</p>
            <p className="font-mono text-xl font-bold text-[#14F195]">{mockCredential.earnedBy}</p>
            <p className="text-xs text-muted-foreground font-mono">has successfully completed</p>
            <p className="font-mono text-2xl font-black text-foreground">{mockCredential.name}</p>
            {track && (
              <p className="text-sm text-muted-foreground font-mono">
                {track.icon} {track.name} Track · Level {mockCredential.level}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 py-3 border-y border-border">
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-foreground">
                {mockCredential.coursesCompleted}
              </div>
              <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
                Courses
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-[#14F195]">
                {Number(mockCredential.totalXp).toLocaleString()}
              </div>
              <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
                XP Earned
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-lg font-bold text-foreground">
                {mockCredential.level}
              </div>
              <div className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">
                Level
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-mono">
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
          className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-border-hover font-mono text-sm rounded transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("viewOnExplorer")}
        </a>
        <DownloadButton label={t("download")} />
        <CopyShareButton url={certificateUrl} label={t("share")} />
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-muted-foreground hover:text-foreground hover:border-border-hover font-mono text-sm rounded transition-colors"
          title="Share on X (Twitter)"
        >
          <XIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share on X</span>
        </a>
      </div>

      {/* On-chain details */}
      <div className="mt-6 bg-card border border-border rounded p-4 space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Asset Address</span>
          <span className="text-foreground break-all">{id.slice(0, 20)}...</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Program</span>
          <span className="text-foreground">ACADBRCB3...3ucf</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network</span>
          <span className="text-[#14F195]">Solana Devnet</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Standard</span>
          <span className="text-foreground">Metaplex Core (Soulbound)</span>
        </div>
      </div>
    </div>
  );
}

// Client component for clipboard copy
function CopyShareButton({ url, label }: { url: string; label: string }) {
  return (
    <button
      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#14F195] text-black font-mono font-semibold text-sm rounded hover:bg-accent-dim transition-colors"
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
