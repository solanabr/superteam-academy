"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { applyEdits } from "@/lib/ai/apply-edits";
import { trackComprehensionCheckAnswered } from "@/lib/analytics/events";
import type { ChallengeEventContext } from "@/lib/analytics/events";
import type {
  CodeEdit,
  ProposeResponse,
  VerifyOutcome,
} from "@/lib/ai/partner-types";

type DiffLine =
  | { kind: "unchanged"; text: string }
  | { kind: "removed"; text: string }
  | { kind: "added"; text: string };

type DiffRow = DiffLine | { kind: "gap"; count: number };

/** Context lines kept around each change; longer unchanged runs collapse. */
const HUNK_CONTEXT = 2;

/**
 * Collapse the full line diff to hunks: every changed line plus HUNK_CONTEXT
 * unchanged lines on each side; anything further from a change becomes one
 * "⋯ N unchanged" gap row. The learner reviews the CHANGE, not the whole file
 * (owner call, 04-08) — Monaco still holds the full buffer.
 */
export function toHunkRows(lines: DiffLine[]): DiffRow[] {
  const keep = new Array<boolean>(lines.length).fill(false);
  lines.forEach((line, i) => {
    if (line.kind === "unchanged") return;
    for (
      let j = Math.max(0, i - HUNK_CONTEXT);
      j <= Math.min(lines.length - 1, i + HUNK_CONTEXT);
      j++
    ) {
      keep[j] = true;
    }
  });
  const rows: DiffRow[] = [];
  let gap = 0;
  const flush = () => {
    if (gap > 0) rows.push({ kind: "gap", count: gap });
    gap = 0;
  };
  lines.forEach((line, i) => {
    if (keep[i]) {
      flush();
      rows.push(line);
    } else {
      gap++;
    }
  });
  flush();
  return rows;
}

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
  edits: CodeEdit[];
  rationale: string;
  check: ProposeResponse["check"];
  checkToken: string;
  onVerify: (
    checkToken: string,
    pickedIndex: 0 | 1 | 2
  ) => Promise<VerifyOutcome>;
  onAccept: (proposed: string) => void;
  onReject: () => void;
  stale: boolean;
  /** Content-id context for `comprehension_check_answered` (#866). Optional:
   *  without it the event simply doesn't fire — never a render difference. */
  eventCtx?: ChallengeEventContext;
  className?: string;
}

export function DiffCard({
  current,
  edits,
  rationale,
  check,
  checkToken,
  onVerify,
  onAccept,
  onReject,
  stale,
  eventCtx,
  className,
}: DiffCardProps) {
  const t = useTranslations("aiPartner");
  const [correctPick, setCorrectPick] = useState<number | null>(null);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [wrongExplanation, setWrongExplanation] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Attempt counter for `comprehension_check_answered` (#866). Keyed by
  // `checkToken` — ONE seal is minted per proposed patch, so the token is the
  // identity of a check INSTANCE. A new proposal (new token) restarts at 1,
  // which is what makes attempt=1 mean "first try at THIS check" rather than
  // "first check of the lesson". Keyed rather than mount-scoped because a card
  // can be re-rendered in place; a ref rather than state because the count
  // never affects the rendered output.
  const attemptRef = useRef<{ token: string; count: number }>({
    token: checkToken,
    count: 0,
  });

  // Reconstruct the proposed buffer by applying the search/replace edits to the
  // learner's live code. A clean apply drives the usual diff + earned-Accept
  // flow; a miss (the model's snippet no longer occurs — e.g. the code changed
  // since the request) degrades to showing the edit textually, never mutating
  // the buffer.
  const applied = useMemo(() => applyEdits(current, edits), [current, edits]);

  const lines = useMemo(
    () => (applied.ok ? toHunkRows(diffLines(current, applied.proposed)) : []),
    [current, applied]
  );

  // The correct index/explanation are sealed server-side (`checkToken`) and
  // never shipped to the browser — grading a pick is an async round trip to
  // /api/ai/partner/verify, never a local compare. A correct pick UNLOCKS the
  // Accept button (it does NOT apply the code); the learner then explicitly
  // clicks Accept. `onVerify` fails SAFE (network/non-ok → correct:false), so a
  // failed verify can never unlock Accept.
  const handlePick = async (index: 0 | 1 | 2) => {
    if (checking || correctPick !== null) return;
    setChecking(true);
    setWrongPick(null);
    setWrongExplanation(null);
    if (attemptRef.current.token !== checkToken) {
      attemptRef.current = { token: checkToken, count: 0 };
    }
    const attempt = attemptRef.current.count + 1;
    try {
      const result = await onVerify(checkToken, index);
      // Only a real server verdict counts as an attempt. A failed round trip
      // (`failed: true`, or the throw handled below) is not a wrong answer —
      // counting it would inflate the primary metric's error rate with network
      // noise. The UI still treats it as not-correct, so Accept stays locked.
      if (!result.failed) {
        attemptRef.current.count = attempt;
      }
      if (eventCtx && !result.failed) {
        trackComprehensionCheckAnswered({
          lessonId: eventCtx.lessonId,
          courseId: eventCtx.courseId,
          correct: result.correct,
          attempt,
        });
      }
      if (result.correct) {
        setCorrectPick(index);
        return;
      }
      setWrongPick(index);
      setWrongExplanation(result.explanation || t("diff.checkVerifyError"));
    } catch {
      setWrongPick(index);
      setWrongExplanation(t("diff.checkVerifyError"));
    } finally {
      setChecking(false);
    }
  };

  // Applying the change is gated on a verified-correct answer — never fires
  // otherwise, so the code only changes on an intentional, earned Accept.
  const handleAccept = () => {
    if (!applied.ok || stale || correctPick === null || accepted) return;
    onAccept(applied.proposed);
    setAccepted(true);
  };

  // Degrade path: the edit no longer applies to the live buffer. Show it
  // textually (search → replace) so the learner can apply it by hand — never a
  // silent no-op, never an Accept that would corrupt the buffer.
  if (!applied.ok) {
    return (
      <div
        className={cn("card-chunky space-y-3 p-4", className)}
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

        <div className="flex items-start gap-2 rounded-md border p-2 text-xs [background:var(--danger-light)] [border-color:var(--danger-border)]">
          <WarningCircle
            size={14}
            weight="duotone"
            className="mt-0.5 shrink-0 text-danger"
            aria-hidden="true"
          />
          <span className="text-danger">{t("diff.applyFailed")}</span>
        </div>

        {edits.map((edit, index) => (
          <div
            key={index}
            className="overflow-x-auto rounded-md border border-border [background:var(--input)]"
          >
            <pre className="whitespace-pre p-3 font-mono text-xs leading-relaxed">
              <div className="text-danger [background:var(--danger-light)]">
                <span className="sr-only">{t("diff.lineRemoved")}: </span>
                {edit.search}
              </div>
              <div className="text-success [background:var(--success-light)]">
                <span className="sr-only">{t("diff.lineAdded")}: </span>
                {edit.replace}
              </div>
            </pre>
          </div>
        ))}

        <div className="flex items-center gap-2">
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
          {lines.map((line, index) => {
            if (line.kind === "gap") {
              const label = t("diff.unchangedCollapsed", {
                count: line.count,
              });
              return (
                <div
                  key={index}
                  className="select-none px-1 text-text-3"
                  aria-label={label}
                >
                  {"\u22EF "}
                  {label}
                </div>
              );
            }
            return (
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
            );
          })}
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

      {!stale && !accepted && (
        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          {/* Same anatomy as the lesson quiz (quiz-block.tsx): display-font
              question label, option rows that judge via border color. */}
          <p className="font-display text-xs font-extrabold uppercase text-text-3">
            {t("diff.checkPrompt")}
          </p>
          <p className="font-display text-sm font-bold text-text">
            {check.question}
          </p>
          <div className="space-y-1.5">
            {check.options.map((option, index) => {
              const isCorrectPick = correctPick === index;
              const isWrongPick = wrongPick === index;
              return (
                <button
                  key={index}
                  type="button"
                  disabled={checking || correctPick !== null}
                  onClick={() => void handlePick(index as 0 | 1 | 2)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    correctPick !== null
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-inset",
                    isCorrectPick
                      ? "border-success"
                      : isWrongPick
                        ? "border-danger"
                        : "border-border"
                  )}
                >
                  {isCorrectPick && (
                    <Check
                      size={14}
                      weight="bold"
                      className="shrink-0 text-success"
                      aria-hidden="true"
                    />
                  )}
                  {isWrongPick && (
                    <X
                      size={14}
                      weight="bold"
                      className="shrink-0 text-danger"
                      aria-hidden="true"
                    />
                  )}
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          {correctPick !== null && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <Check size={14} weight="bold" aria-hidden="true" />
              {t("diff.checkCorrect")}
            </p>
          )}
          {wrongPick !== null && wrongExplanation !== null && (
            <div className="flex items-start gap-2 text-sm font-medium text-danger">
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
                {wrongExplanation}
              </span>
            </div>
          )}
        </div>
      )}

      {accepted ? (
        <div className="flex items-center gap-1.5 text-sm font-medium text-success">
          <Check size={16} weight="bold" aria-hidden="true" />
          {t("diff.applied")}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAccept}
            disabled={stale || correctPick === null}
            title={correctPick === null ? t("diff.acceptLocked") : undefined}
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
      )}
    </div>
  );
}
