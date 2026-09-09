"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ArrowRight, CheckCircle, Copy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatElapsed } from "@/lib/deploy/progress";
import type { SaveStatus } from "@/lib/deploy/save-deployment";

interface DeploySuccessCardProps {
  programId: string;
  rentLamports: number;
  durationMs: number;
  /** XP this lesson pays, for the un-submitted state's button badge. */
  xpReward: number;
  /** XP actually credited, once the lesson is complete. */
  earnedXp: number | null;
  isComplete: boolean;
  /** Runs the lesson's normal submit path. */
  onSubmit: () => void;
  /** The server-record save status. Submit is only enabled once the deploy
   *  is actually recorded — the capstone credential gate reads that record,
   *  not the on-chain deploy itself. */
  saveStatus: SaveStatus | "idle";
  nextLessonHref: string | null;
  /** The server-record status, rendered under the stats. */
  saveStatusSlot?: ReactNode;
  /** A warning that needs attention even though the deploy itself succeeded —
   *  e.g. the session key's leftover-rent sweep failed and needs a retry. */
  noticeSlot?: ReactNode;
}

const EXPLORER_BASE = "https://explorer.solana.com";

/**
 * Where a finished deploy ends.
 *
 * The Submit button used to live in the editor toolbar, a column away from the
 * card that had just told the learner their program was live — so the lesson
 * looked finished while its XP sat unclaimed. Submitting happens here, on the
 * same card, through the lesson's existing submit path.
 */
export function DeploySuccessCard({
  programId,
  rentLamports,
  durationMs,
  xpReward,
  earnedXp,
  isComplete,
  onSubmit,
  saveStatus,
  nextLessonHref,
  saveStatusSlot,
  noticeSlot,
}: DeploySuccessCardProps) {
  const t = useTranslations("deploy.deployment");
  const [copied, setCopied] = useState(false);

  const isSaved = saveStatus === "saved";
  const isSaving =
    saveStatus === "saving" ||
    saveStatus === "retrying" ||
    saveStatus === "idle";
  const saveFailed = saveStatus === "retryable" || saveStatus === "rejected";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(programId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [programId]);

  return (
    <Card className="border-2 border-[color:var(--ink-line)] bg-[var(--success-bg)] shadow-[0_3px_0_0_var(--ink-line)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-success">
          <CheckCircle size={20} weight="duotone" aria-hidden="true" />
          {t("success")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-wide text-text-3">
            {t("programId")}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={t("copyProgramId")}
            className="hover:bg-card-hover group flex w-full items-center gap-2 rounded-md border-2 border-[color:var(--ink-line)] bg-card px-3 py-2 font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex-1 truncate text-left">{programId}</span>
            <span className="shrink-0 text-xs text-text-3">
              {copied ? t("copied") : ""}
            </span>
            <Copy size={16} aria-hidden="true" className="shrink-0" />
          </button>
        </div>

        <a
          href={`${EXPLORER_BASE}/address/${programId}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t("viewOnExplorer")}
        </a>

        {(rentLamports > 0 || durationMs > 0) && (
          <dl className="grid grid-cols-2 gap-3 rounded-md border-2 border-[color:var(--ink-line)] bg-card p-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-text-3">
                {t("rentLocked")}
              </dt>
              <dd className="text-sm font-semibold">
                {(rentLamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wide text-text-3">
                {t("deployTime")}
              </dt>
              <dd className="text-sm font-semibold">
                {formatElapsed(durationMs)}
              </dd>
            </div>
          </dl>
        )}

        {noticeSlot}

        {saveStatusSlot}

        {isComplete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-[color:var(--ink-line)] bg-xp px-2.5 py-1 font-display text-sm font-extrabold text-[color:var(--ink-dark)]">
              {t("xpEarned", { xp: String(earnedXp ?? xpReward) })}
            </span>
            {nextLessonHref && (
              <Button asChild variant="primary" size="sm">
                <Link href={nextLessonHref}>
                  {t("nextLesson")}
                  <ArrowRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        ) : saveFailed ? null : (
          <Button
            onClick={onSubmit}
            variant="primary"
            className="w-full"
            disabled={!isSaved}
          >
            {isSaving ? t("recordingDeploy") : t("submitLesson")}
            <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold [background:rgba(255,255,255,0.20)]">
              +{xpReward} XP
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
