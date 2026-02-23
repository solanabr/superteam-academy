"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Award, ExternalLink, Copy, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/hooks/use-user";
import { TRACK_LABELS, TRACK_COLORS } from "@/lib/constants";
import type { Credential } from "@/lib/services/types";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export default function CertificatesPage() {
  const t = useTranslations("certificates");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const { user, connected, loading } = useUser();
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  const credentials: Credential[] = connected ? user.credentials : [];

  function handleCopy(mint: string) {
    copyToClipboard(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-[var(--c-border-prominent)] bg-[var(--c-border-subtle)]">
            <Award className="h-5 w-5 text-[#CA9FF5]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--c-text)]">
              {t("title", { defaultMessage: "Credentials" })}
            </h1>
            <p className="text-sm text-[var(--c-text-2)]">
              {t("subtitle", {
                defaultMessage:
                  "Verifiable on-chain certificates earned through learning",
              })}
            </p>
          </div>
        </div>

        {!connected && (
          <Badge className="gap-1.5 bg-[#CA9FF5]/10 text-[#CA9FF5] border-[#CA9FF5]/20">
            <Wallet className="h-3 w-3" />
            {t("connectWallet", { defaultMessage: "Connect Wallet" })}
          </Badge>
        )}
      </div>

      {/* Stats Row */}
      <dl className="flex flex-wrap gap-4 border-y border-[var(--c-border-subtle)] py-5 mb-8">
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-2xl font-mono text-[var(--c-text)] tabular-nums">
            {credentials.length}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("totalCredentials", { defaultMessage: "Credentials" })}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-2xl font-mono text-[#00FFA3] tabular-nums">
            {credentials
              .reduce((sum, c) => sum + c.xpEarned, 0)
              .toLocaleString()}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("totalXP", { defaultMessage: "Total XP" })}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-2xl font-mono text-[var(--c-text)] tabular-nums">
            {new Set(credentials.map((c) => c.track)).size}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("tracksCompleted", { defaultMessage: "Tracks" })}
          </dt>
        </div>
        <div
          className="w-px bg-[var(--c-border-subtle)] hidden sm:block"
          role="presentation"
        />
        <div className="flex-1 min-w-[100px] text-center">
          <dd className="text-2xl font-mono text-[var(--c-text)] tabular-nums">
            {credentials.reduce((sum, c) => sum + c.coursesCompleted, 0)}
          </dd>
          <dt className="text-xs font-medium text-[var(--c-text-2)] uppercase tracking-wider mt-1">
            {t("coursesCompleted", { defaultMessage: "Courses" })}
          </dt>
        </div>
      </dl>

      {/* Credentials Grid */}
      {credentials.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/${locale}/certificates/${cred.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/${locale}/certificates/${cred.id}`);
                }
              }}
              className="group metallic-border relative overflow-hidden flex flex-col cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              {/* Holographic sheen overlay */}
              <div className="credential-sheen absolute inset-0 pointer-events-none z-0" />

              <div className="relative z-10 flex flex-col flex-1 p-6">
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    className="border"
                    style={{
                      backgroundColor: `${TRACK_COLORS[cred.track]}15`,
                      color: TRACK_COLORS[cred.track],
                      borderColor: `${TRACK_COLORS[cred.track]}33`,
                    }}
                  >
                    {TRACK_LABELS[cred.track]}
                  </Badge>
                  <span className="text-sm font-bold tabular-nums text-[var(--c-text)]">
                    {t("level", { defaultMessage: "Level" })} {cred.level}
                  </span>
                </div>

                {/* Center — Track Initial */}
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="h-20 w-20 rounded-[2px] flex items-center justify-center mb-4 border border-[var(--c-border-prominent)] bg-[var(--c-border-subtle)]">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: TRACK_COLORS[cred.track] }}
                    >
                      {TRACK_LABELS[cred.track].charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--c-text)] mb-1">
                    {TRACK_LABELS[cred.track]}{" "}
                    {t("credential", { defaultMessage: "Credential" })}
                  </h3>
                  <p className="text-sm text-[var(--c-text-2)]">
                    {cred.coursesCompleted}{" "}
                    {t("coursesLabel", { defaultMessage: "courses completed" })}
                  </p>
                  <p className="text-sm font-mono font-semibold text-[#00FFA3] mt-1 neon-green">
                    {cred.xpEarned.toLocaleString()} XP
                  </p>
                </div>

                {/* Footer Details */}
                <div className="space-y-2 text-sm border-t border-[var(--c-border-subtle)] pt-4 mt-auto">
                  {cred.mint ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--c-text-2)]">
                        {t("mintAddress", { defaultMessage: "Mint" })}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-xs text-[var(--c-text-em)]">
                        {cred.mint.slice(0, 6)}...{cred.mint.slice(-4)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(cred.mint);
                          }}
                          className="hover:text-[var(--c-text)] transition-colors"
                          aria-label={t("copyMint", {
                            defaultMessage: "Copy mint address",
                          })}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {copiedMint === cred.mint && (
                          <span className="text-[10px] text-[#55E9AB] ml-1">
                            {t("copied", { defaultMessage: "Copied" })}
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--c-text-2)]">
                        {t("mintAddress", { defaultMessage: "Mint" })}
                      </span>
                      <span className="font-mono text-xs text-[var(--c-text-2)]">
                        {t("pendingMint", {
                          defaultMessage: "Pending",
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--c-text-2)]">
                      {t("issuedOn", { defaultMessage: "Issued" })}
                    </span>
                    <span className="text-[var(--c-text-em)] text-xs">
                      {new Date(cred.issuedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <span className="flex-1 inline-flex items-center justify-center gap-2 rounded-[2px] text-xs font-medium border border-[var(--c-border-subtle)] text-[var(--c-text)] group-hover:bg-[var(--c-border-subtle)] group-hover:border-[var(--c-border-prominent)] transition-colors duration-150 h-8 px-3">
                    <Award className="h-3.5 w-3.5" />
                    {t("viewCertificate", {
                      defaultMessage: "View Certificate",
                    })}
                  </span>
                  {cred.explorerUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          cred.explorerUrl,
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                      className="inline-flex items-center justify-center rounded-[2px] text-[var(--c-text-2)] hover:bg-[var(--c-border-subtle)] hover:text-[var(--c-text)] transition-colors duration-150 h-8 w-8 shrink-0"
                      aria-label={t("viewOnExplorer", {
                        defaultMessage: "View on Explorer",
                      })}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--c-bg-card)] border border-[var(--c-border-subtle)] rounded-[2px] flex flex-col items-center justify-center py-20">
          <div className="rounded-[2px] border border-dashed border-[var(--c-border-prominent)] p-4 mb-6">
            <Award className="w-12 h-12 text-[var(--c-text-2)]/30" />
          </div>
          <p className="font-mono text-xs text-[var(--c-text-2)]/50 mb-3">
            &#47;&#47; no credentials
          </p>
          <h3 className="text-xl font-medium text-[var(--c-text-em)] mb-2">
            {t("noCredentials", { defaultMessage: "No credentials yet" })}
          </h3>
          <p className="text-sm text-[var(--c-text-2)] max-w-md mx-auto text-center mb-8">
            {t("noCredentialsDescription", {
              defaultMessage:
                "Complete courses to earn verifiable on-chain credentials as ZK compressed credentials on Solana.",
            })}
          </p>
          <Link href={`/${locale}/courses`}>
            <Button>
              {t("browseCourses", { defaultMessage: "Browse Courses" })}
            </Button>
          </Link>
        </div>
      )}

      {/* Bottom info */}
      {connected && credentials.length > 0 && (
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-[2px] border border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] px-5 py-3">
            <div className="status-dot" />
            <span className="text-sm text-[var(--c-text-2)]">
              {t("onChainFooter", {
                defaultMessage:
                  "Credentials are fetched from on-chain enrollment data and Metaplex Core assets.",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
