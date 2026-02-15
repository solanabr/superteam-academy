"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Download, Share2, Shield, CheckCircle2, Copy, Check, Award } from "lucide-react";
import { highlight } from "@/lib/syntax-highlight";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TRACKS } from "@/types/course";
import { LEVEL_NAMES } from "@/types/credential";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAllProgress, useXP, useDisplayName, useCertificates } from "@/lib/hooks/use-service";
import { toast } from "sonner";

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { publicKey } = useWallet();
  const { data: allProgress } = useAllProgress();
  const { data: xp } = useXP();
  const { data: displayName } = useDisplayName();
  const certRef = useRef<HTMLDivElement>(null);
  const [metaCopied, setMetaCopied] = useState(false);

  const trackId = parseInt(id) || 0;
  const track = TRACKS[trackId];
  const wallet = publicKey?.toBase58() ?? "Not Connected";
  const shortWallet = wallet.length > 10 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
  const { data: certificates } = useCertificates(trackId);

  const completedCount = allProgress?.filter((p) => p.completedAt).length ?? 0;
  const totalXP = xp ?? 0;
  const level = completedCount >= 3 ? 3 : completedCount >= 1 ? 2 : 1;
  const levelName = LEVEL_NAMES[level] ?? "Beginner";

  const latestCert = certificates?.[0];
  const earnedDate = latestCert
    ? new Date(latestCert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const txHash = latestCert?.txHash || null;
  const shortTxHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : null;

  const primaryColor = track?.color ?? "#008c4c";
  const secondaryColor = "#ffd23f";

  const nftMetadata = {
    name: `Superteam Academy — ${track?.display ?? "Solana"} ${levelName}`,
    symbol: "STACRED",
    description: `On-chain credential for completing the ${track?.display ?? "Solana"} track at ${levelName} level on Superteam Academy.`,
    attributes: [
      { trait_type: "Track", value: track?.display ?? "Unknown" },
      { trait_type: "Level", value: levelName },
      { trait_type: "Courses Completed", value: completedCount.toString() },
      { trait_type: "Total XP", value: totalXP.toString() },
      ...(displayName ? [{ trait_type: "Learner", value: displayName }] : []),
    ],
  };

  const copyMetadata = () => {
    navigator.clipboard.writeText(JSON.stringify(nftMetadata, null, 2));
    setMetaCopied(true);
    toast.success("NFT metadata copied");
    setTimeout(() => setMetaCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(certRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `superteam-${track?.name ?? "certificate"}-${levelName.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Certificate downloaded!");
    } catch {
      toast.error("Failed to generate image. Try again.");
    }
  };

  const handleShare = () => {
    const nameText = displayName ? `${displayName} earned` : "I earned";
    const text = `${nameText} a ${track?.display ?? "Solana"} ${levelName} credential on @SuperteamAcademy with ${totalXP} XP!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* NFT Certificate Card */}
      <div ref={certRef}>
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div
            className="relative"
            style={{
              background: `radial-gradient(ellipse at 30% 0%, ${primaryColor}18 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, ${secondaryColor}18 0%, transparent 50%), linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)`,
            }}
          >
            {/* Top gradient bar */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})` }} />

            <div className="p-8 sm:p-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <span className="text-sm font-black text-white">S</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">Superteam Academy</p>
                    <p className="text-[11px] text-muted-foreground/70">On-Chain Credential</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1.5 text-[10px] font-semibold px-2.5 py-1">
                  <Shield className="h-3 w-3" /> Soulbound NFT
                </Badge>
              </div>

              {/* NFT Visual + Track */}
              <div className="text-center mb-10">
                <div className="mx-auto mb-8 relative">
                  {/* Outer glow ring */}
                  <div
                    className="mx-auto h-40 w-40 rounded-3xl p-[2px]"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      boxShadow: `0 0 80px ${primaryColor}30, 0 0 40px ${secondaryColor}20`,
                    }}
                  >
                    <div className="h-full w-full rounded-[22px] bg-background flex items-center justify-center relative overflow-hidden">
                      {/* Background pattern */}
                      <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                          backgroundImage: `radial-gradient(${primaryColor} 1px, transparent 1px)`,
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <div className="text-center relative z-10">
                        <Award className="h-10 w-10 mx-auto mb-1" style={{ color: primaryColor }} />
                        <p className="text-4xl font-black" style={{ color: primaryColor }}>{levelName[0]}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.25em] mt-0.5">{levelName}</p>
                      </div>
                    </div>
                  </div>
                  {/* Verified badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 border shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-solana-green" />
                    <span className="text-xs font-semibold">Verified</span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl tracking-tight">{track?.display ?? "Solana Development"}</h1>
                <p className="mt-1.5 text-base font-semibold" style={{ color: primaryColor }}>{levelName} Credential</p>
              </div>

              <Separator className="my-8" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 text-center mb-8">
                <div className="space-y-1">
                  <p className="text-3xl font-black text-xp-gold">{totalXP.toLocaleString()}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">XP Earned</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black">{completedCount}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Courses</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black" style={{ color: primaryColor }}>{levelName}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Level</p>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Recipient */}
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Awarded to</p>
                {displayName && (
                  <p className="text-xl font-bold mb-1">{displayName}</p>
                )}
                <p className="font-mono text-sm text-muted-foreground">{shortWallet}</p>
                <p className="mt-3 text-xs text-muted-foreground/70">{earnedDate}</p>
              </div>
            </div>

            {/* Bottom gradient bar */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor}, ${secondaryColor})` }} />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {txHash && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
                "_blank"
              )
            }
          >
            <ExternalLink className="h-4 w-4" /> View on Explorer
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> Share on X
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download PNG
        </Button>
      </div>

      {/* On-Chain Verification */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> On-Chain Verification
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This credential is a soulbound NFT on the Solana blockchain. It is permanently
            verifiable, non-transferable, and cannot be forged.
          </p>
          <div className="space-y-2.5 text-sm">
            {displayName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learner</span>
                <span className="font-medium">{displayName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token Standard</span>
              <span className="font-medium">Token-2022 (NonTransferable)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Track</span>
              <span className="font-medium" style={{ color: track?.color }}>{track?.display ?? "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">Solana Devnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credential ID</span>
              <span className="font-mono text-xs">{id}</span>
            </div>
            {txHash && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Transaction</span>
                <button
                  className="font-mono text-xs hover:underline cursor-pointer"
                  style={{ color: primaryColor }}
                  onClick={() => {
                    navigator.clipboard.writeText(txHash);
                    toast.success("Transaction hash copied");
                  }}
                  title={txHash}
                >
                  {shortTxHash}
                </button>
              </div>
            )}
            {latestCert && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <span className="font-medium">{earnedDate}</span>
              </div>
            )}
          </div>

          {/* Individual course certificates */}
          {certificates && certificates.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">Course Certificates</h3>
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div key={cert.txHash || cert.courseId} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">{cert.courseTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString()} · {cert.xpEarned} XP
                      </p>
                    </div>
                    {cert.txHash ? (
                      <a
                        href={`https://explorer.solana.com/tx/${cert.txHash}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] hover:underline cursor-pointer"
                        style={{ color: primaryColor }}
                        title={cert.txHash}
                      >
                        {cert.txHash.slice(0, 6)}...{cert.txHash.slice(-4)}
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60">Awaiting on-chain tx</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* NFT Metadata */}
      <Card className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b px-4 py-2 bg-[#16161e]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7f849c]">JSON</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[#7f849c] hover:text-white hover:bg-white/10"
            onClick={copyMetadata}
          >
            {metaCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="text-xs ml-1">{metaCopied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
        <div className="bg-[#1e1e2e] p-4 overflow-x-auto">
          <pre className="m-0"><code
            className="font-mono text-[13px] leading-relaxed text-[#cdd6f4]"
            dangerouslySetInnerHTML={{ __html: highlight(JSON.stringify(nftMetadata, null, 2), "json") }}
          /></pre>
        </div>
      </Card>
    </div>
  );
}
