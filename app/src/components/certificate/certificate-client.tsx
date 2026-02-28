"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  ExternalLink,
  Twitter,
  Download,
  Share2,
  Shield,
  CheckCircle,
  ArrowLeft,
  Copy,
  Wallet,
  AlertTriangle,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useWalletCompat as useWallet } from "@/lib/hooks/use-wallet-compat";
import { truncateAddress } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { progressService } from "@/lib/services";
import { useCourses } from "@/lib/hooks/use-courses";
import { useLearningProgress } from "@/lib/hooks/use-learning-progress";
import type { Credential } from "@/types";

export interface CertificateClientProps {
  certId: string;
}

/** Format a difficulty string into a human-readable level label */
function formatTrackLevel(difficulty: string, trackLevel: number): string {
  const label =
    difficulty === "beginner"
      ? "Beginner"
      : difficulty === "intermediate"
        ? "Intermediate"
        : "Advanced";
  return `${label} (Level ${trackLevel})`;
}

/** Generate a deterministic devnet-style placeholder address from a slug */
function generatePlaceholderAddress(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffffffff;
  }
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let addr = "";
  let seed = hash;
  for (let i = 0; i < 44; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    addr += chars[seed % chars.length];
  }
  return addr;
}

export default function CertificateClient({ certId }: CertificateClientProps) {
  const t = useTranslations("certificate");
  const tc = useTranslations("common");
  const { publicKey } = useWallet();
  const { getCourseBySlug, isLoading: coursesLoading } = useCourses();
  const { progressMap, isLoaded: progressLoaded } = useLearningProgress();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [onChainCredentials, setOnChainCredentials] = useState<Credential[]>([]);
  useEffect(() => {
    if (!publicKey) return;
    progressService
      .getCredentials(publicKey.toBase58())
      .then(setOnChainCredentials)
      .catch(() => {});
  }, [publicKey]);

  // The certId is the course slug
  const course = getCourseBySlug(certId);
  const progress = progressMap[certId];
  const isCompleted = progress?.percentage === 100 && !!progress?.completedAt;

  // Build certificate data dynamically from course + progress
  const certData = useMemo(() => {
    if (!course) return null;

    const placeholderMint = generatePlaceholderAddress(certId);
    const completionDate = progress?.completedAt
      ? new Date(progress.completedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    const walletAddress = publicKey?.toBase58() ?? "";

    return {
      id: certId,
      courseName: course.title,
      recipient: walletAddress ? truncateAddress(walletAddress, 6) : "",
      completionDate,
      xpEarned: course.xpTotal,
      track: course.trackName,
      trackLevel: formatTrackLevel(course.difficulty, course.trackLevel),
      mintAddress: placeholderMint,
      explorerUrl: `https://explorer.solana.com/address/${placeholderMint}?cluster=devnet`,
      ownerAddress: walletAddress,
    };
  }, [course, progress, publicKey, certId]);

  // Loading state
  if (coursesLoading || !progressLoaded) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("back")}
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Course not found
  if (!course || !certData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("back")}
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-20">
          <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("courseNotFound")}
          </h2>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {t("courseNotFoundDescription")}
          </p>
          <Link
            href="/courses"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-st-green/10 px-5 py-2.5 text-sm font-semibold text-st-green transition-colors hover:bg-st-green/20"
          >
            <BookOpen className="h-4 w-4" />
            {tc("back")}
          </Link>
        </div>
      </div>
    );
  }

  // Course not completed yet
  if (!isCompleted) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc("back")}
        </Link>
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-20">
          <Award className="h-10 w-10 text-muted-foreground" />
          <h2 className="font-heading text-xl font-bold text-foreground">
            {t("notCompleted")}
          </h2>
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {t("notCompletedDescription")}
          </p>
          {progress && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-32 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-st-green"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span>{progress.percentage}%</span>
            </div>
          )}
          <Link
            href={`/courses/${certId}`}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-st-green/10 px-5 py-2.5 text-sm font-semibold text-st-green transition-colors hover:bg-st-green/20"
          >
            <BookOpen className="h-4 w-4" />
            {t("goToCourse")}
          </Link>
        </div>
      </div>
    );
  }

  function handleCopyMintAddress() {
    if (certData) {
      navigator.clipboard.writeText(certData.mintAddress);
    }
  }

  async function handleDownloadImage() {
    if (!certificateRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(certificateRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#0a0a0a",
      });
      const link = document.createElement("a");
      link.download = `superteam-certificate-${certData!.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate certificate image:", err);
    }
  }

  const tweetText = encodeURIComponent(
    `I just completed "${certData.courseName}" on @SuperteamAcademy and earned ${certData.xpEarned} XP! \n\nVerifiable on-chain credential on Solana.\n\n#Solana #SuperteamAcademy #Web3`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc("back")}
      </Link>

      {/* Certificate Card */}
      <div
        ref={certificateRef}
        className="rounded-2xl p-[2px]"
        style={{
          background:
            "linear-gradient(144.34deg, #e8cc4a -29.96%, #d4b83d 50%, #346b4a 131.56%)",
        }}
      >
        <div className="rounded-2xl bg-card px-6 py-10 sm:px-12 sm:py-14">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-st-green/10">
              <Award className="h-5 w-5 text-st-green" />
            </div>
            <span className="font-heading text-lg font-bold tracking-wide text-foreground">
              Superteam Academy
            </span>
          </div>

          <h1 className="mt-8 text-center font-heading text-3xl font-bold tracking-tight text-gradient-gold sm:text-4xl">
            {t("title")}
          </h1>

          <div className="mx-auto mt-6 h-[2px] w-32 rounded-full bg-gradient-to-r from-brazil-gold-light via-brazil-gold to-st-green" />

          <p className="mt-8 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t("forCompleting")}
          </p>
          <h2 className="mt-3 text-center font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {certData.courseName}
          </h2>

          <p className="mt-6 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t("awardedTo")}
          </p>
          <p className="mt-2 text-center font-heading text-xl font-bold text-gradient-brand sm:text-2xl">
            {certData.recipient}
          </p>

          <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("issuedOn", { date: "" })}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {certData.completionDate}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                XP
              </p>
              <p className="mt-1 text-sm font-semibold text-xp">
                {certData.xpEarned.toLocaleString()} XP
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("trackLevel")}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {certData.track}
              </p>
              <p className="text-xs text-muted-foreground">
                {certData.trackLevel}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-10 h-[2px] w-32 rounded-full bg-gradient-to-r from-st-green via-brazil-teal to-brazil-gold-light" />

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-brazil-green">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">{t("verified")}</span>
          </div>
        </div>
      </div>

      {/* On-chain Verification */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-st-green" />
          <h3 className="font-heading text-lg font-bold">
            {t("onChainDetails")}
          </h3>
          <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
            {t("devnetDemo")}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t("credentialId")}
                </p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {truncateAddress(certData.mintAddress, 6)}
                </p>
              </div>
              <button
                onClick={handleCopyMintAddress}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-st-green/30 hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
                {tc("copy")}
              </button>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t("solanaExplorer")}
              </p>
              <a
                href={certData.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-st-green transition-colors hover:text-st-green-light"
              >
                {tc("viewOnExplorer")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-muted-foreground">
                {t("devnetExplorerNote")}
              </p>
            </div>

            {certData.ownerAddress && (
              <div className="flex items-center gap-2 rounded-lg bg-brazil-green/5 px-4 py-3">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-brazil-green" />
                <p className="text-sm text-foreground">
                  {t("ownershipVerified", {
                    wallet: truncateAddress(certData.ownerAddress, 6),
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Sharing & Download */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-st-green" />
          <h3 className="font-heading text-lg font-bold">{t("share")}</h3>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent({
                name: "certificate_shared",
                params: { platform: "twitter", cert_id: certData.id },
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#1DA1F2]/10 px-5 py-2.5 text-sm font-semibold text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/20"
          >
            <Twitter className="h-4 w-4" />
            {t("shareTwitter")}
          </a>

          <a
            href="https://www.linkedin.com/sharing/share-offsite/?url=https://academy.superteam.fun"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent({
                name: "certificate_shared",
                params: { platform: "linkedin", cert_id: certData.id },
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2]/10 px-5 py-2.5 text-sm font-semibold text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/20"
          >
            <Share2 className="h-4 w-4" />
            {t("shareLinkedIn")}
          </a>

          <button
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brazil-gold/30 hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            {t("download")}
          </button>
        </div>
      </section>

      {/* On-Chain Credentials from Wallet */}
      {publicKey && onChainCredentials.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-st-green" />
            <h3 className="font-heading text-lg font-bold">
              {t("yourOnChainCredentials")}
            </h3>
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              {t("onChainBadge")}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {onChainCredentials.map((cred) => (
              <div
                key={cred.trackId}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {cred.trackName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("credentialInfo", {
                        level: cred.currentLevel,
                        count: cred.coursesCompleted,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-xp">
                      {cred.totalXpEarned.toLocaleString()} XP
                    </p>
                  </div>
                </div>
                {cred.metadataUri && (
                  <a
                    href={cred.metadataUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-st-green hover:underline"
                  >
                    {t("viewMetadata")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
