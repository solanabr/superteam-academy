"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import type { ParsonsBlockData, ParsonsLineData } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import type { BlockRenderProps } from "./types";

/** Snapshot of the last Check: the arranged ids it judged and the per-slot verdict. */
interface CheckResult {
  order: string[];
  correct: boolean;
  /** Index → whether the line at that solution slot matches `correctOrder`. */
  slotOk: boolean[];
}

/**
 * Stable, deterministic shuffle keyed off the block `key` + line id — so the
 * bank order is identical on the server and client (no hydration mismatch) and
 * never re-scrambles across renders, yet the authored `lines` array order (which
 * may sit near the solution order) is not shown verbatim.
 */
function seededOrder(
  blockKey: string,
  lines: ParsonsLineData[]
): ParsonsLineData[] {
  const hash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  return [...lines].sort(
    (a, b) => hash(blockKey + a.id) - hash(blockKey + b.id)
  );
}

function sequenceEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Arrange-the-lines (Parsons) renderer. The learner moves lines from an
 * available "bank" into an ordered "solution" list and reorders them; the proof
 * is the solution's line ids in order (`{ order }`), reported via `ctx.setProof`.
 *
 * Fully keyboard-operable: every action is a real button (Add / Remove / Move
 * up / Move down), never drag-only. `correctOrder` ships to the client (D4
 * open-book), so the per-attempt Check gives instant feedback with no API — the
 * server grader (sequence equality) stays authoritative at completion.
 *
 * Indentation is presentational: a line's leading whitespace renders inside a
 * monospace `pre` as an indent guide. Order is the only graded dimension in this
 * version; indent-sensitive grading is a deliberate follow-up seam.
 */
export function ParsonsBlock({ block, ctx }: BlockRenderProps) {
  const b = block as ParsonsBlockData;
  const t = useTranslations("lesson");

  const byId = useMemo(() => new Map(b.lines.map((l) => [l.id, l])), [b.lines]);
  const bankOrder = useMemo(
    () => seededOrder(b.key, b.lines).map((l) => l.id),
    [b.key, b.lines]
  );

  // The solution is the ordered list of placed line ids; the bank is every line
  // not currently placed, kept in the stable seeded order.
  const [solution, setSolution] = useState<string[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);

  const bank = useMemo(
    () => bankOrder.filter((id) => !solution.includes(id)),
    [bankOrder, solution]
  );

  useEffect(() => {
    ctx.setProof(b.key, { order: solution });
  }, [solution, b.key, ctx]);

  // Any edit retires the last verdict — feedback always describes what is
  // currently arranged.
  const mutate = useCallback((next: (prev: string[]) => string[]) => {
    setSolution(next);
    setResult(null);
  }, []);

  const add = useCallback(
    (id: string) => mutate((prev) => [...prev, id]),
    [mutate]
  );
  const remove = useCallback(
    (id: string) => mutate((prev) => prev.filter((x) => x !== id)),
    [mutate]
  );
  const move = useCallback(
    (index: number, delta: -1 | 1) =>
      mutate((prev) => {
        const target = index + delta;
        if (target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[index], next[target]] = [next[target]!, next[index]!];
        return next;
      }),
    [mutate]
  );

  const check = useCallback(() => {
    if (solution.length === 0) return;
    const slotOk = solution.map((id, i) => id === b.correctOrder[i]);
    setResult({
      order: solution,
      correct: sequenceEqual(solution, b.correctOrder),
      slotOk,
    });
  }, [solution, b.correctOrder]);

  const lineText = (id: string): string => byId.get(id)?.content ?? id;

  return (
    <div className="space-y-4 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card">
      <p className="font-display font-bold text-text">{b.prompt}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank */}
        <section aria-label={t("parsonsBankLabel")} className="space-y-2">
          <h4 className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
            {t("parsonsBankLabel")}
          </h4>
          <ul className="space-y-1.5">
            {bank.map((id) => (
              <li key={id} className="flex items-stretch gap-2">
                <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-subtle px-2 py-1.5 font-mono text-sm text-text">
                  {lineText(id)}
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => add(id)}
                  aria-label={t("parsonsAddLine", { line: lineText(id) })}
                >
                  <Plus size={16} weight="bold" aria-hidden="true" />
                </Button>
              </li>
            ))}
            {bank.length === 0 && (
              <li className="text-sm text-text-3">{t("parsonsBankEmpty")}</li>
            )}
          </ul>
        </section>

        {/* Solution */}
        <section aria-label={t("parsonsSolutionLabel")} className="space-y-2">
          <h4 className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
            {t("parsonsSolutionLabel")}
          </h4>
          {solution.length === 0 ? (
            <p className="text-sm text-text-3">{t("parsonsSolutionEmpty")}</p>
          ) : (
            <ol className="space-y-1.5">
              {solution.map((id, index) => {
                const judged = result?.order[index] === id;
                const slotOk = judged ? result!.slotOk[index] : undefined;
                return (
                  <li key={id} className="flex items-stretch gap-2">
                    <pre
                      className={`flex-1 overflow-x-auto rounded-md border px-2 py-1.5 font-mono text-sm text-text ${
                        slotOk === undefined
                          ? "border-border bg-subtle"
                          : slotOk
                            ? "border-success"
                            : "border-danger"
                      }`}
                    >
                      {lineText(id)}
                    </pre>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-disabled={index === 0}
                        aria-label={t("parsonsMoveUp", { line: lineText(id) })}
                      >
                        <ArrowUp size={14} weight="bold" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => move(index, 1)}
                        disabled={index === solution.length - 1}
                        aria-disabled={index === solution.length - 1}
                        aria-label={t("parsonsMoveDown", {
                          line: lineText(id),
                        })}
                      >
                        <ArrowDown size={14} weight="bold" aria-hidden="true" />
                      </Button>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => remove(id)}
                      aria-label={t("parsonsRemoveLine", {
                        line: lineText(id),
                      })}
                    >
                      <X size={14} weight="bold" aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <div>
        <Button
          variant="pushSuccess"
          size="sm"
          onClick={check}
          disabled={solution.length === 0}
          aria-disabled={solution.length === 0}
        >
          {t("parsonsCheck")}
        </Button>
      </div>

      {/* Always-mounted live region: the verdict + explanation are announced
          when they appear. Nothing is unmounted from under the keyboard user. */}
      <div aria-live="polite" className="space-y-2">
        {result && (
          <>
            <p
              className={`flex items-center gap-1.5 text-sm font-medium ${
                result.correct ? "text-success" : "text-danger"
              }`}
            >
              {result.correct ? (
                <CheckCircle size={16} weight="bold" aria-hidden="true" />
              ) : (
                <XCircle size={16} weight="bold" aria-hidden="true" />
              )}
              {result.correct ? t("parsonsCorrect") : t("parsonsIncorrect")}
            </p>
            {b.explanation && (
              <div className="space-y-1 rounded-md border border-border bg-subtle p-3">
                <p className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
                  {t("quizExplanationLabel")}
                </p>
                <p className="text-sm text-text">{b.explanation}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
