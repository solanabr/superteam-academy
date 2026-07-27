"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown, CheckCircle, XCircle } from "@phosphor-icons/react";
import type { QuizBlockData, QuizQuestionData } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BlockRenderProps } from "./types";

/**
 * Snapshot of a question's last Check: the selection it judged and the verdict.
 * Cleared when the selection changes, so feedback always describes what is
 * currently chosen.
 */
interface CheckResult {
  chosen: string[];
  correct: boolean;
}

/**
 * Client-side mirror of the server quiz grader's set-equality rule. The
 * `correct` flags ship to the client DELIBERATELY (D4 open-book ruling), so
 * instant feedback needs no API — the server stays authoritative at completion.
 */
function isChoiceCorrect(q: QuizQuestionData, chosen: string[]): boolean {
  const correct = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
  return (
    chosen.length === correct.size && chosen.every((id) => correct.has(id))
  );
}

/**
 * Collects the learner's option selections into a `QuizProof`
 * (`{ selections: { [questionId]: optionId[] } }`) and reports it upward via
 * `ctx.setProof`. Completion grading is server-side (set equality) — the
 * per-question Check below is instant formative feedback only (LX-C1): it
 * renders the authored per-option `feedback` for whatever the learner chose,
 * plus the question's `explanation` after any check.
 */
export function QuizBlock({ block, ctx }: BlockRenderProps) {
  const b = block as QuizBlockData;
  const t = useTranslations("lesson");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  // Sticky "has been checked at least once" — once feedback + explanation have
  // been revealed, the AI pane has nothing left to spoil (F18 gate below).
  const [checkedEver, setCheckedEver] = useState<Record<string, boolean>>({});
  // Section starts open (#770); collapsing leaves the score badge as the recap.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    ctx.setProof(b.key, { selections });
  }, [selections, b.key, ctx]);

  const allChecked = b.questions.every((q) => checkedEver[q.id]);
  useEffect(() => {
    ctx.setQuizAnswered(b.key, allChecked);
  }, [allChecked, b.key, ctx]);

  const toggle = useCallback(
    (questionId: string, optionId: string, multi: boolean) => {
      setSelections((prev) => {
        const current = prev[questionId] ?? [];
        if (multi) {
          const next = current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId];
          return { ...prev, [questionId]: next };
        }
        return { ...prev, [questionId]: [optionId] };
      });
      // The last verdict judged a different selection — retire it.
      setResults((prev) => {
        if (!(questionId in prev)) return prev;
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    },
    []
  );

  const check = useCallback((q: QuizQuestionData, chosen: string[]) => {
    if (chosen.length === 0) return;
    setResults((prev) => ({
      ...prev,
      [q.id]: { chosen, correct: isChoiceCorrect(q, chosen) },
    }));
    setCheckedEver((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: true }));
  }, []);

  // Collapsed summary (#770): how many questions are currently answered
  // correctly. Turns green only at a clean sweep, so the badge doubles as the
  // "done" signal when the section is folded away.
  const correctCount = b.questions.filter((q) => results[q.id]?.correct).length;
  const allCorrect = correctCount === b.questions.length;

  return (
    <div className="rounded-[var(--r-lg)] border-[2.5px] border-border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <h3 className="font-display text-sm font-extrabold uppercase text-text-3">
          {t("quiz")}
        </h3>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
            allCorrect
              ? "text-success [background:var(--success-light)]"
              : "text-text-3 [background:var(--input)]"
          )}
        >
          {t("quizScore", {
            correct: correctCount,
            total: b.questions.length,
          })}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          aria-hidden="true"
          className={cn(
            "ml-auto shrink-0 text-text-3 transition-transform",
            !open && "-rotate-90"
          )}
        />
        <span className="sr-only">{t("toggleSection")}</span>
      </button>

      <div className={cn("space-y-6 px-5 pb-5", !open && "hidden")}>
        {b.questions.map((q) => {
          const multi = q.multiSelect ?? false;
          const chosen = selections[q.id] ?? [];
          const result: CheckResult | undefined = results[q.id];
          const chosenWithFeedback = result
            ? q.options.filter(
                (o) => result.chosen.includes(o.id) && o.feedback
              )
            : [];
          return (
            <fieldset key={q.id} className="space-y-2">
              <legend className="font-display font-bold text-text">
                {q.prompt}
              </legend>
              <div className="space-y-1.5">
                {q.options.map((o) => {
                  const judged = result?.chosen.includes(o.id) ?? false;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle ${
                        judged
                          ? o.correct
                            ? "border-success"
                            : "border-danger"
                          : "border-border"
                      }`}
                    >
                      <input
                        type={multi ? "checkbox" : "radio"}
                        name={q.id}
                        value={o.id}
                        checked={chosen.includes(o.id)}
                        onChange={() => toggle(q.id, o.id, multi)}
                        className="accent-primary"
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })}
              </div>
              <div>
                <Button
                  variant="pushSuccess"
                  size="sm"
                  onClick={() => check(q, chosen)}
                  disabled={chosen.length === 0}
                  aria-disabled={chosen.length === 0}
                >
                  {t("quizCheck")}
                </Button>
              </div>
              {/* Always-mounted live region: the verdict + authored feedback are
                announced when they appear. Focus stays on the Check button —
                nothing is unmounted from under the keyboard user. */}
              <div aria-live="polite" className="space-y-2">
                {result && (
                  <>
                    <p
                      className={`flex items-center gap-1.5 text-sm font-medium ${
                        result.correct ? "text-success" : "text-danger"
                      }`}
                    >
                      {result.correct ? (
                        <CheckCircle
                          size={16}
                          weight="bold"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle size={16} weight="bold" aria-hidden="true" />
                      )}
                      {result.correct ? t("quizCorrect") : t("quizIncorrect")}
                    </p>
                    {chosenWithFeedback.map((o) => (
                      <p key={o.id} className="text-sm text-text">
                        {multi && (
                          <span className="font-medium">{o.label}: </span>
                        )}
                        {o.feedback}
                      </p>
                    ))}
                    {q.explanation && (
                      <div className="space-y-1 rounded-md border border-border bg-subtle p-3">
                        <p className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
                          {t("quizExplanationLabel")}
                        </p>
                        <p className="text-sm text-text">{q.explanation}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
