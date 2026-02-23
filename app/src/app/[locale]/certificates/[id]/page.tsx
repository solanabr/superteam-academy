"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ExternalLink,
  Copy,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCourseById, courses } from "@/lib/services/courses";
import { TRACK_LABELS, TRACK_COLORS, SOLANA_NETWORK } from "@/lib/constants";
import { SuperteamLogo } from "@/components/ui/superteam-logo";
import { ShareActions } from "./share-actions";
import { useUser } from "@/lib/hooks/use-user";
import type { Credential } from "@/lib/services/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateMint(mint: string): string {
  return mint.length > 12 ? `${mint.slice(0, 6)}...${mint.slice(-4)}` : mint;
}

function getExplorerUrl(address: string): string {
  const cluster = SOLANA_NETWORK === "devnet" ? "?cluster=devnet" : "";
  return `https://explorer.solana.com/address/${address}${cluster}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CertificatePage() {
  const t = useTranslations("certificate");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;
  const { user, connected } = useUser();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Find credential by ID or mint address
  const credential: Credential | null = connected
    ? (user.credentials.find((c) => c.id === id || c.mint === id) ?? null)
    : null;

  // Resolve the course from the credential or parse enrollment ID
  const resolvedCourseId = id.startsWith("enrollment-")
    ? id.replace("enrollment-", "")
    : null;
  const course =
    (resolvedCourseId ? getCourseById(resolvedCourseId) : null) ??
    (credential ? courses.find((c) => c.track === credential.track) : null) ??
    courses[0];

  const mintAddress = credential?.mint || "";
  const walletName = user.wallet ?? "";
  const completionDate = credential
    ? new Date(credential.issuedAt).toLocaleDateString()
    : new Date().toLocaleDateString();
  const xpEarned = credential?.xpEarned ?? course.xpReward;
  const explorerUrl =
    credential?.explorerUrl || (mintAddress ? getExplorerUrl(mintAddress) : "");
  const network =
    SOLANA_NETWORK === "devnet" ? "Solana Devnet" : "Solana Mainnet";

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-24 pb-8 md:pt-28 md:pb-12">
      {/* Back link */}
      <div className="w-full max-w-3xl mb-6">
        <button
          onClick={() => router.push(`/${locale}/certificates`)}
          className="inline-flex items-center gap-2 text-sm text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("title", { defaultMessage: "Credentials" })}
        </button>
      </div>

      {/* Certificate Container */}
      <div
        id="certificate-card"
        className="metallic-border aspect-[1.414] w-full max-w-3xl bg-[var(--c-bg-card)] p-8 md:p-12 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl"
      >
        {/* Top gradient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#55E9AB] to-[#03E1FF]" />

        {/* Corner accents */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[var(--c-border-prominent)]" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[var(--c-border-prominent)]" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[var(--c-border-prominent)]" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[var(--c-border-prominent)]" />

        {/* Logo */}
        <div className="mb-6">
          <SuperteamLogo size={48} className="text-[#55E9AB]" />
        </div>

        {/* Heading */}
        <p className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-[0.25em]">
          {t("title", { defaultMessage: "Certificate of Completion" })}
        </p>

        {/* Course Title */}
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-[var(--c-text)]">
          {course.title}
        </h1>

        {/* Track Badge */}
        <div className="mt-3 flex justify-center">
          <Badge
            className="text-sm px-4 py-1 border"
            style={{
              backgroundColor: `${TRACK_COLORS[course.track]}15`,
              color: TRACK_COLORS[course.track],
              borderColor: `${TRACK_COLORS[course.track]}33`,
            }}
          >
            {TRACK_LABELS[course.track]} {t("trackSuffix")}
          </Badge>
        </div>

        {/* Divider */}
        <div className="my-6 w-24 h-px bg-gradient-to-r from-transparent via-[#ECE4FD33] to-transparent" />

        {/* Certifies section */}
        <p className="text-sm text-[var(--c-text-2)]">
          {t("certifiesThat", { defaultMessage: "This certifies that" })}
        </p>
        <p className="mt-2 text-xl md:text-2xl font-bold text-[var(--c-text)] font-mono">
          {walletName}
        </p>

        {/* Completion details */}
        <p className="mt-4 text-sm text-[var(--c-text-2)]">
          {t("completedAll", {
            defaultMessage: "has successfully completed all",
          })}{" "}
          <span className="font-mono font-semibold text-[var(--c-text-em)]">
            {course.lessonCount}
          </span>{" "}
          {t("lessonsAndEarned", { defaultMessage: "lessons and earned" })}
        </p>
        <p className="mt-2 text-3xl font-bold text-[#00FFA3] tabular-nums font-mono">
          +{xpEarned} XP
        </p>

        {/* Divider */}
        <div className="my-6 w-24 h-px bg-gradient-to-r from-transparent via-[#ECE4FD33] to-transparent" />

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-sm">
          <div>
            <p className="font-medium text-[var(--c-text)]">
              {t("completedOn", { defaultMessage: "Completed" })}
            </p>
            <p className="text-[var(--c-text-2)] mt-0.5">{completionDate}</p>
          </div>
          <div className="w-px h-8 bg-[var(--c-border-subtle)]" />
          <div>
            <p className="font-medium text-[var(--c-text)]">
              {t("issuer", { defaultMessage: "Issuer" })}
            </p>
            <p className="text-[var(--c-text-2)] mt-0.5">Superteam Academy</p>
          </div>
          <div className="w-px h-8 bg-[var(--c-border-subtle)]" />
          <div>
            <p className="font-medium text-[var(--c-text)]">
              {t("network", { defaultMessage: "Network" })}
            </p>
            <p className="text-[var(--c-text-2)] mt-0.5">{network}</p>
          </div>
        </div>
      </div>

      {/* On-Chain Verification Section */}
      <div className="mt-8 w-full max-w-3xl grid gap-4 md:grid-cols-2">
        {/* Verification Status */}
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-[#55E9AB]" />
            <h3 className="text-sm font-semibold text-[var(--c-text)]">
              {t("verifiedOnChain", {
                defaultMessage: "On-Chain Verification",
              })}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Verification status */}
            <div className="flex items-center gap-2 p-2.5 rounded-[1px] bg-[#00FFA3]/5 border border-[#00FFA3]/20">
              <CheckCircle2 className="h-4 w-4 text-[#00FFA3] shrink-0" />
              <span className="text-xs font-mono text-[#00FFA3]">
                {t("verified", { defaultMessage: "Verified on Solana" })}
              </span>
            </div>

            {/* ZK Compression proof */}
            <div className="flex items-center gap-2 p-2.5 rounded-[1px] bg-[#03E1FF]/5 border border-[#03E1FF]/20">
              <GitBranch className="h-4 w-4 text-[#03E1FF] shrink-0" />
              <span className="text-xs font-mono text-[#03E1FF]">
                {t("merkleProof", {
                  defaultMessage: "ZK Compression proof valid (Light Protocol)",
                })}
              </span>
            </div>

            {/* Explorer link */}
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#55E9AB] hover:text-[#00FFA3] transition-colors mt-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("viewExplorer", {
                  defaultMessage: "View on Solana Explorer",
                })}
                <span className="text-[10px] font-mono text-[var(--c-text-2)]">
                  ({SOLANA_NETWORK})
                </span>
              </a>
            )}
          </div>
        </div>

        {/* Credential Details Panel */}
        <div className="rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-[#CA9FF5]" />
            <h3 className="text-sm font-semibold text-[var(--c-text)]">
              {t("nftDetails", { defaultMessage: "Credential Details" })}
            </h3>
          </div>

          <div className="space-y-3">
            {/* Mint Address */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--c-text-2)]">
                {t("mintAddr", { defaultMessage: "Mint Address" })}
              </span>
              {mintAddress ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-[var(--c-text-em)]">
                    {truncateMint(mintAddress)}
                  </span>
                  <button
                    onClick={() => handleCopy(mintAddress, "mint")}
                    className="text-[var(--c-text-2)] hover:text-[var(--c-text)] transition-colors"
                    aria-label={t("copyMintAddress")}
                  >
                    {copiedField === "mint" ? (
                      <CheckCircle2 className="h-3 w-3 text-[#55E9AB]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="font-mono text-xs text-[var(--c-text-2)]">
                  {t("pendingMint", { defaultMessage: "Pending" })}
                </span>
              )}
            </div>

            {/* Collection */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--c-text-2)]">
                {t("collection", { defaultMessage: "Collection" })}
              </span>
              <span className="font-mono text-xs text-[var(--c-text-em)]">
                Superteam Academy
              </span>
            </div>

            {/* Standard */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--c-text-2)]">
                {t("standard", { defaultMessage: "Standard" })}
              </span>
              <span className="font-mono text-xs text-[var(--c-text-em)]">
                ZK Compressed (Light Protocol)
              </span>
            </div>

            {/* Attributes */}
            <div className="border-t border-[var(--c-border-subtle)] pt-3 mt-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--c-text-2)] mb-2">
                {t("attributes", { defaultMessage: "Attributes" })}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: t("attrTrack"),
                    value: TRACK_LABELS[credential?.track ?? course.track],
                  },
                  {
                    label: t("attrLevel"),
                    value: String(credential?.level ?? 1),
                  },
                  {
                    label: t("attrXP"),
                    value: `${xpEarned}`,
                  },
                  {
                    label: t("attrCourses"),
                    value: String(credential?.coursesCompleted ?? 1),
                  },
                ].map((attr) => (
                  <div
                    key={attr.label}
                    className="flex items-center justify-between p-2 rounded-[1px] border border-[var(--c-border-subtle)] bg-[var(--c-border-subtle)]/30"
                  >
                    <span className="text-[10px] text-[var(--c-text-2)]">
                      {attr.label}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[var(--c-text)]">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Row */}
      <ShareActions courseTitle={course.title} certificateId={id} />
    </div>
  );
}
