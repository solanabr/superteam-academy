"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProposeResponse } from "@/lib/ai/partner-types";

type DiffLine =
  | { kind: "unchanged"; text: string }
  | { kind: "removed"; text: string }
  | { kind: "added"; text: string };

/**
 * Line-by-line diff via LCS (longest common subsequence). Files here are
 * small (a single lesson's editor buffer), so the O(n*m) DP table is cheap —
 * no need for a streaming/Myers diff.
 */
function diffLines(current: string, proposed: string): DiffLine[] {
  const a = current.split("\n");
  const b = proposed.split("\n");
  const n = a.length;
  const m = b.length;

  // dp[i][j] = length of LCS of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] =
        a[i] === b[j]
          ? dp[i + 1]![j + 1]! + 1
          : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      lines.push({ kind: "unchanged", text: a[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      lines.push({ kind: "removed", text: a[i]! });
      i++;
    } else {
      lines.push({ kind: "added", text: b[j]! });
      j++;
    }
  }
  while (i < n) {
    lines.push({ kind: "removed", text: a[i]! });
    i++;
  }
  while (j < m) {
    lines.push({ kind: "added", text: b[j]! });
    j++;
  }
  return lines;
}

interface DiffCardProps {
  current: string;
  proposed: string;
  rationale: string;
  check: ProposeResponse["check"];
  onAccept: (proposed: string) => void;
  onReject: () => void;
  stale: boolean;
  className?: string;
}

export function DiffCard({
  current,
  proposed,
  rationale,
  check,
  onAccept,
  onReject,
  stale,
  className,
}: DiffCardProps) {
  const t = useTranslations("aiPartner");
  const [checkRevealed, setCheckRevealed] = useState(false);
  const [wrongPick, setWrongPick] = useState<number | null>(null);

  const lines = useMemo(
    () => diffLines(current, proposed),
    [current, proposed]
  );

  const handleAcceptClick = () => {
    if (stale) return;
    setCheckRevealed(true);
  };

  const handlePick = (index: number) => {
    if (index === check.correctIndex) {
      setWrongPick(null);
      onAccept(proposed);
      return;
    }
    setWrongPick(index);
  };

  return (
    <div
      className={cn(
        "card-chunky space-y-3 p-4",
        stale && "opacity-60",
        className
      )}
      role="group"
      aria-label={t("a11y.diffCard")}
    >
      <div className="flex items-center gap-2">
        <Sparkle
          size={16}
          weight="duotone"
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-text">{rationale}</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border [background:var(--input)]">
        <pre className="whitespace-pre p-3 font-mono text-xs leading-relaxed">
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-2 px-1",
                line.kind === "added" &&
                  "text-success [background:var(--success-light)]",
                line.kind === "removed" &&
                  "text-danger [background:var(--danger-light)]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "w-3 shrink-0 select-none",
                  line.kind === "added" && "text-success",
                  line.kind === "removed" && "text-danger",
                  line.kind === "unchanged" && "text-text-3"
                )}
              >
                {line.kind === "added"
                  ? "+"
                  : line.kind === "removed"
                    ? "-"
                    : " "}
              </span>
              {line.kind !== "unchanged" && (
                <span className="sr-only">
                  {line.kind === "added"
                    ? t("diff.lineAdded")
                    : t("diff.lineRemoved")}
                  :
                </span>
              )}
              <span>{line.text}</span>
            </div>
          ))}
        </pre>
      </div>

      {stale && (
        <div className="flex items-center gap-2 rounded-md border p-2 text-xs [background:var(--danger-light)] [border-color:var(--danger-border)]">
          <WarningCircle
            size={14}
            weight="duotone"
            className="shrink-0 text-danger"
            aria-hidden="true"
          />
          <span className="text-danger">{t("diff.stale")}</span>
        </div>
      )}

      {checkRevealed && !stale && (
        <div className="space-y-2 rounded-md border-[2px] p-3 [background:var(--accent-bg)] [border-color:var(--accent-border-s)]">
          <p className="text-xs font-semibold text-text">
            {t("diff.checkPrompt")}
          </p>
          <p className="text-sm text-text">{check.question}</p>
          <div className="flex flex-wrap gap-2">
            {check.options.map((option, index) => (
              <Button
                key={index}
                type="button"
                variant={
                  wrongPick === index ? "destructiveOutline" : "secondary"
                }
                size="sm"
                onClick={() => handlePick(index)}
              >
                {option}
              </Button>
            ))}
          </div>
          {wrongPick !== null && (
            <div className="flex items-start gap-2 text-xs text-danger">
              <WarningCircle
                size={14}
                weight="duotone"
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>
                <span className="font-semibold">
                  {t("diff.checkIncorrect")}
                </span>{" "}
                {check.explanation}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleAcceptClick}
          disabled={stale}
          className="gap-1.5"
        >
          <Check size={14} weight="bold" aria-hidden="true" />
          {t("diff.accept")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReject}
          className="gap-1.5"
        >
          <X size={14} weight="bold" aria-hidden="true" />
          {t("diff.reject")}
        </Button>
      </div>
    </div>
  );
}
