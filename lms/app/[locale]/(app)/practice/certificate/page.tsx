"use client";

import { useRef, useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Download, Share2, Shield, CheckCircle2, Copy, Check, Award, Trophy, ExternalLink } from "lucide-react";
import { highlight } from "@/lib/syntax-highlight";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePracticeProgress, useDisplayName } from "@/lib/hooks/use-service";
import { PRACTICE_CHALLENGES } from "@/lib/data/practice-challenges";
import { PRACTICE_MILESTONES, MILESTONE_LEVELS, PRACTICE_CATEGORIES, PRACTICE_DIFFICULTY_CONFIG } from "@/types/practice";
import type { PracticeCategory } from "@/types/practice";
import { toast } from "sonner";

export default function PracticeCertificatePage() {
  const t = useTranslations("practice");
  const tc = useTranslations("common");
  const tCert = useTranslations("certificates");
  const { publicKey } = useWallet();
  const { completed: completedIds, txHashes, claimedMilestones, milestoneTxHashes } = usePracticeProgress();
  const { data: displayName } = useDisplayName();
  const certRef = useRef<HTMLDivElement>(null);
  const [metaCopied, setMetaCopied] = useState(false);

  const wallet = publicKey?.toBase58() ?? "Not Connected";
  const shortWallet = wallet.length > 10 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
  const solvedCount = completedIds.length;

  const { milestone, level, color, nextMilestone } = useMemo(() => {
    let best = 0;
    let next: number | null = null;
    for (const m of PRACTICE_MILESTONES) {
      if (solvedCount >= m) best = m;
      else if (next === null) next = m;
    }
    if (best === 0) return { milestone: 0, level: "None", color: "#71717a", nextMilestone: PRACTICE_MILESTONES[0] };
    const info = MILESTONE_LEVELS[best];
    return { milestone: best, level: info.name, color: info.color, nextMilestone: next };
  }, [solvedCount]);

  const practiceXP = completedIds.reduce((sum, id) => {
    const c = PRACTICE_CHALLENGES.find((ch) => ch.id === id);
    return sum + (c?.xpReward ?? 0);
  }, 0);

  const categoriesMastered = useMemo(() => {
    const catCounts: Record<string, number> = {};
    for (const id of completedIds) {
      const c = PRACTICE_CHALLENGES.find((ch) => ch.id === id);
      if (c) catCounts[c.category] = (catCounts[c.category] ?? 0) + 1;
    }
    return Object.entries(catCounts)
      .filter(([, count]) => count >= 3)
      .map(([cat]) => cat as PracticeCategory);
  }, [completedIds]);

  const solvedChallenges = useMemo(() => {
    return completedIds
      .map((id) => PRACTICE_CHALLENGES.find((ch) => ch.id === id))
      .filter(Boolean)
      .reverse();
  }, [completedIds]);

  const earnedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const nftMetadata = {
    name: `Superteam Academy — Practice Arena ${level}`,
    symbol: "STPRAC",
    description: `Practice Arena ${level} credential for solving ${solvedCount} challenges on Superteam Academy.`,
    attributes: [
      { trait_type: "Level", value: level },
      { trait_type: "Challenges Solved", value: solvedCount.toString() },
      { trait_type: "Practice XP", value: practiceXP.toString() },
      { trait_type: "Categories Mastered", value: categoriesMastered.length.toString() },
      ...(displayName ? [{ trait_type: "Learner", value: displayName }] : []),
    ],
  };

  const copyMetadata = () => {
    navigator.clipboard.writeText(JSON.stringify(nftMetadata, null, 2));
    setMetaCopied(true);
    toast.success(tCert("nftMetadataCopied"));
    setTimeout(() => setMetaCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `superteam-practice-${level.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(tCert("certificateDownloaded"));
    } catch {
      toast.error(tCert("downloadFailed"));
    }
  };

  const handleShare = () => {
    const nameText = displayName ? `${displayName} earned` : "I earned";
    const text = `${nameText} a Practice Arena ${level} credential on @SuperteamAcademy — ${solvedCount} challenges solved with ${practiceXP} XP!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  if (milestone === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold">{t("noCertificate")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("noCertificateDesc", { count: PRACTICE_MILESTONES[0] })}
        </p>
        <Button asChild className="mt-6" variant="solana">
          <Link href="/practice">{t("startPracticing")}</Link>
        </Button>
      </div>
    );
  }

  const secondaryColor = "#ffd23f";
  const latestMilestoneTx = milestoneTxHashes[String(milestone)] ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/practice" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc("backTo", { page: t("practiceArena") })}
      </Link>

      <div ref={certRef}>
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div
            className="relative"
            style={{
              background: `radial-gradient(ellipse at 30% 0%, ${color}18 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, ${secondaryColor}18 0%, transparent 50%), linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)`,
            }}
          >
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${color}, ${secondaryColor}, ${color})` }} />

            <div className="p-8 sm:p-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${color}, ${secondaryColor})` }}
                  >
                    <span className="text-sm font-black text-white">S</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em]">Superteam Academy</p>
                    <p className="text-[11px] text-muted-foreground/70">{t("practiceArenaCredential")}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1.5 text-[10px] font-semibold px-2.5 py-1">
                  <Shield className="h-3 w-3" /> {tc("soulboundNft")}
                </Badge>
              </div>

              {/* NFT Visual */}
              <div className="text-center mb-10">
                <div className="mx-auto mb-8 relative">
                  <div
                    className="mx-auto h-40 w-40 rounded-3xl p-[2px]"
                    style={{
                      background: `linear-gradient(135deg, ${color}, ${secondaryColor})`,
                      boxShadow: `0 0 80px ${color}30, 0 0 40px ${secondaryColor}20`,
                    }}
                  >
                    <div
                      className="h-full w-full rounded-[22px] flex items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.08]"
                        style={{
                          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <div className="text-center relative z-10">
                        <Award className="h-10 w-10 mx-auto mb-1 text-white" />
                        <p className="text-4xl font-black text-white">{level[0]}</p>
                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-[0.25em] mt-0.5">{level}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 border shadow-md">
                    <CheckCircle2 className="h-3.5 w-3.5 text-solana-green" />
                    <span className="text-xs font-semibold">{tc("verified")}</span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl tracking-tight">{t("practiceArena")}</h1>
                <p className="mt-1.5 text-base font-semibold" style={{ color }}>{tCert("credential", { level })}</p>
              </div>

              <Separator className="my-8" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 text-center mb-8">
                <div className="space-y-1">
                  <p className="text-3xl font-black">{solvedCount}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{tc("solved")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-xp-gold">{practiceXP.toLocaleString()}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("practiceXP")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black">{categoriesMastered.length}</p>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t("categories")}</p>
                </div>
              </div>

              {/* Next milestone progress */}
              {nextMilestone && (
                <div className="mb-8">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{t("nextMilestone")}</span>
                    <span className="font-semibold" style={{ color: MILESTONE_LEVELS[nextMilestone].color }}>
                      {MILESTONE_LEVELS[nextMilestone].name} ({solvedCount}/{nextMilestone})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min((solvedCount / nextMilestone) * 100, 100)}%`,
                        background: `linear-gradient(90deg, ${color}, ${MILESTONE_LEVELS[nextMilestone].color})`,
                      }}
                    />
                  </div>
                </div>
              )}

              {categoriesMastered.length > 0 && (
                <>
                  <Separator className="my-8" />
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("categoriesMastered")}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {categoriesMastered.map((cat) => (
                        <Badge key={cat} variant="outline" style={{ borderColor: PRACTICE_CATEGORIES[cat].color, color: PRACTICE_CATEGORIES[cat].color }}>
                          {PRACTICE_CATEGORIES[cat].label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-8" />

              {/* Recipient */}
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{tc("awardedTo")}</p>
                {displayName && <p className="text-xl font-bold mb-1">{displayName}</p>}
                <p className="font-mono text-sm text-muted-foreground">{shortWallet}</p>
                <p className="mt-3 text-xs text-muted-foreground/70">{earnedDate}</p>
              </div>
            </div>

            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${color}, ${secondaryColor})` }} />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {latestMilestoneTx && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://explorer.solana.com/tx/${latestMilestoneTx}?cluster=devnet`, "_blank")}
          >
            <ExternalLink className="h-4 w-4" /> {tc("viewOn")}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> {tc("shareOnX")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" /> {tc("downloadPng")}
        </Button>
      </div>

      {/* On-Chain Verification */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> {tCert("onChainVerification")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {tCert("verificationDescription")}
          </p>
          <div className="space-y-2.5 text-sm">
            {displayName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tCert("learner")}</span>
                <span className="font-medium">{displayName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCert("tokenStandard")}</span>
              <span className="font-medium">Token-2022 (NonTransferable)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCert("track")}</span>
              <span className="font-medium" style={{ color }}>{t("practiceArena")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCert("levelLabel")}</span>
              <span className="font-bold" style={{ color }}>{level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tCert("networkLabel")}</span>
              <span className="font-medium">Solana Devnet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("challengesSolved")}</span>
              <span className="font-medium">{solvedCount} / {PRACTICE_CHALLENGES.length}</span>
            </div>
            {latestMilestoneTx && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{tCert("transaction")}</span>
                <button
                  className="font-mono text-xs hover:underline cursor-pointer"
                  style={{ color }}
                  onClick={() => {
                    navigator.clipboard.writeText(latestMilestoneTx);
                    toast.success(tCert("txHashCopied"));
                  }}
                  title={latestMilestoneTx}
                >
                  {latestMilestoneTx.slice(0, 8)}...{latestMilestoneTx.slice(-8)}
                </button>
              </div>
            )}
          </div>

          {/* Milestone history */}
          {claimedMilestones.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="text-sm font-semibold mb-2">{t("milestoneHistory")}</h3>
              <div className="space-y-2">
                {PRACTICE_MILESTONES.filter((m) => claimedMilestones.includes(m)).map((m) => {
                  const info = MILESTONE_LEVELS[m];
                  const tx = milestoneTxHashes[String(m)];
                  return (
                    <div key={m} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                        <div>
                          <p className="font-medium">{info.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m} {tc("solved").toLowerCase()} · {info.solReward} SOL
                          </p>
                        </div>
                      </div>
                      {tx ? (
                        <a
                          href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] hover:underline"
                          style={{ color: info.color }}
                          title={tx}
                        >
                          {tx.slice(0, 6)}...{tx.slice(-4)}
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">{tCert("awaitingTx")}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recently Solved Challenges */}
      {solvedChallenges.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-solana-green" /> {t("recentlySolved")}
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {solvedChallenges.map((ch) => {
                if (!ch) return null;
                const tx = txHashes[ch.id];
                const diffConfig = PRACTICE_DIFFICULTY_CONFIG[ch.difficulty];
                const catConfig = PRACTICE_CATEGORIES[ch.category];
                return (
                  <div key={ch.id} className="flex items-center justify-between text-sm rounded-md border px-3 py-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="font-medium truncate">{ch.title}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: diffConfig.color }} className="font-medium">{diffConfig.label}</span>
                          <span className="text-muted-foreground">·</span>
                          <span style={{ color: catConfig.color }}>{catConfig.label}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xp-gold font-medium">{ch.xpReward} XP</span>
                        </div>
                      </div>
                    </div>
                    {tx ? (
                      <a
                        href={`https://explorer.solana.com/tx/${tx}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] hover:underline flex-shrink-0 ml-2"
                        style={{ color }}
                        title={tx}
                      >
                        {tx.slice(0, 6)}...{tx.slice(-4)}
                      </a>
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-solana-green flex-shrink-0 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
            <span className="text-xs ml-1">{metaCopied ? tc("copied") : tc("copy")}</span>
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
