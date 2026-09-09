"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import {
  deployProgress,
  formatElapsed,
  DEPLOY_PHASE_KEYS,
  type DeployPhase,
} from "@/lib/deploy/progress";

const EXPLORER_BASE = "https://explorer.solana.com";

export interface DeployLogEntry {
  /** Absent for notices that aren't a transaction (e.g. a throttle wait). */
  signature?: string;
  message: string;
}

interface DeployProgressViewProps {
  phase: DeployPhase;
  chunkCurrent: number;
  chunkTotal: number;
  elapsedMs: number;
  entries: DeployLogEntry[];
}

/**
 * What the deploy is doing, in one bar and one sentence.
 *
 * The signature log used to BE the progress display — a cramped, auto-scrolling
 * list of "Chunk 3/74 uploaded" that says nothing about how far along the
 * deploy is or whether it is still moving. It is still here, with its explorer
 * links, but folded away under a disclosure.
 */
export function DeployProgressView({
  phase,
  chunkCurrent,
  chunkTotal,
  elapsedMs,
  entries,
}: DeployProgressViewProps) {
  const t = useTranslations("deploy.progress");
  const { percent, remainingSeconds } = deployProgress({
    chunkCurrent,
    chunkTotal,
    elapsedMs,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-sm font-extrabold text-text">
          {t(DEPLOY_PHASE_KEYS[phase])}
        </p>
        {chunkTotal > 0 && (
          <p className="font-mono text-xs text-text-2">
            {t("chunks", {
              current: String(Math.min(chunkCurrent, chunkTotal)),
              total: String(chunkTotal),
            })}
          </p>
        )}
      </div>

      <Progress
        value={percent}
        size="thin"
        variant="primary"
        aria-label={t(DEPLOY_PHASE_KEYS[phase])}
      />

      <div className="flex items-baseline justify-between gap-2 font-mono text-[11px] text-text-3">
        <span>{t("elapsed", { elapsed: formatElapsed(elapsedMs) })}</span>
        {remainingSeconds !== null && (
          <span>{t("remaining", { seconds: String(remainingSeconds) })}</span>
        )}
      </div>

      {entries.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-mono text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            {t("details")}
          </summary>
          <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {entries.map((entry, idx) => (
              <li
                key={`${entry.signature ?? "note"}-${idx}`}
                className="flex items-center gap-2 text-[11px]"
              >
                {entry.signature && (
                  <a
                    href={`${EXPLORER_BASE}/tx/${entry.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 font-mono text-primary hover:underline"
                  >
                    {entry.signature.slice(0, 8)}
                  </a>
                )}
                <span className="truncate text-text-3">{entry.message}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
