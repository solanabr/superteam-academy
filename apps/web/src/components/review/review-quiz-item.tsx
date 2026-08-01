"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, ArrowClockwise } from "@phosphor-icons/react";
import type { QuizQuestionData } from "@superteam-lms/types";
import type { ReviewSessionItem } from "@/lib/review/interleave";
import { Button } from "@/components/ui/button";

type Phase = "answering" | "submitting" | "graded";
type GradeResult = { passed: boolean; box: number };

/** `{ [blockKey]: { [questionId]: optionId[] } }` — one item's whole selection. */
type Selections = Record<string, Record<string, string[]>>;

interface ReviewQuizItemProps {
  item: ReviewSessionItem;
  /** Notifies the session when this item has been graded (progress + a11y). */
  onGraded: (itemKey: string) => void;
}

/**
 * A single gradable review card (LX-B5): the lesson's authored retrieval-close
 * quiz. The learner answers and submits; grading is SERVER-authoritative
 * (`/api/review/grade` re-runs the quiz grader and advances/resets the box).
 * The verdict, authored explanation, and correct options are revealed only after
 * submission — a genuine retrieval attempt, not open-book scanning.
 */
export function ReviewQuizItem({ item, onGraded }: ReviewQuizItemProps) {
  const t = useTranslations("review");
  const [selections, setSelections] = useState<Selections>({});
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [failedToSave, setFailedToSave] = useState(false);

  const questions = useMemo(
    () =>
      item.quiz.flatMap((block) =>
        block.questions.map((q) => ({ blockKey: block.key, q }))
      ),
    [item.quiz]
  );

  const allAnswered = questions.every(
    ({ blockKey, q }) => (selections[blockKey]?.[q.id]?.length ?? 0) > 0
  );

  const toggle = useCallback(
    (blockKey: string, q: QuizQuestionData, optionId: string) => {
      if (phase === "graded") return;
      const multi = q.multiSelect ?? false;
      setSelections((prev) => {
        const block = prev[blockKey] ?? {};
        const current = block[q.id] ?? [];
        const next = multi
          ? current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId]
          : [optionId];
        return { ...prev, [blockKey]: { ...block, [q.id]: next } };
      });
    },
    [phase]
  );

  const submit = useCallback(async () => {
    setPhase("submitting");
    setFailedToSave(false);
    const proofs = Object.fromEntries(
      item.quiz.map((block) => [
        block.key,
        { selections: selections[block.key] ?? {} },
      ])
    );
    try {
      const res = await fetch("/api/review/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: item.itemKey, proofs }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as GradeResult;
      setResult({ passed: data.passed, box: data.box });
      setPhase("graded");
      onGraded(item.itemKey);
    } catch {
      setFailedToSave(true);
      setPhase("answering");
    }
  }, [item.itemKey, item.quiz, selections, onGraded]);

  return (
    <section
      aria-label={t("cardLabel", { lesson: item.lessonTitle })}
      className="space-y-5 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {t("retrievalLabel")}
          </p>
          <h2 className="mt-0.5 font-display text-base font-black tracking-[-0.25px]">
            {item.lessonTitle}
          </h2>
        </div>
      </div>

      {questions.map(({ blockKey, q }) => {
        const chosen = selections[blockKey]?.[q.id] ?? [];
        const multi = q.multiSelect ?? false;
        const graded = phase === "graded";
        return (
          <fieldset key={`${blockKey}:${q.id}`} className="space-y-2">
            <legend className="font-display font-bold text-text">
              {q.prompt}
            </legend>
            <div className="space-y-1.5">
              {q.options.map((o) => {
                const isChosen = chosen.includes(o.id);
                // Reveal correctness only after grading (retrieval, not open-book).
                const border = graded
                  ? o.correct
                    ? "border-success"
                    : isChosen
                      ? "border-danger"
                      : "border-border"
                  : "border-border";
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-inset ${border} ${
                      graded ? "cursor-default" : ""
                    }`}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={`${item.itemKey}:${q.id}`}
                      value={o.id}
                      checked={isChosen}
                      disabled={graded}
                      onChange={() => toggle(blockKey, q, o.id)}
                      className="accent-primary"
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
            {graded && q.explanation && (
              <div className="space-y-1 rounded-md border border-border bg-inset p-3">
                <p className="font-display text-xs font-bold uppercase tracking-wide text-text-3">
                  {t("explanationLabel")}
                </p>
                <p className="text-sm text-text">{q.explanation}</p>
              </div>
            )}
          </fieldset>
        );
      })}

      <div aria-live="polite" className="space-y-2">
        {phase === "graded" && result && (
          <div className="space-y-1">
            <p
              className={`flex items-center gap-1.5 text-sm font-medium ${
                result.passed ? "text-success" : "text-danger"
              }`}
            >
              {result.passed ? (
                <CheckCircle size={16} weight="bold" aria-hidden="true" />
              ) : (
                <XCircle size={16} weight="bold" aria-hidden="true" />
              )}
              {result.passed ? t("answerCorrect") : t("answerIncorrect")}
            </p>
            <p className="text-xs text-text-3">
              {result.passed ? t("scheduledPass") : t("scheduledMiss")}
            </p>
          </div>
        )}
        {failedToSave && (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <XCircle size={16} weight="bold" aria-hidden="true" />
            {t("gradeError")}
          </p>
        )}
      </div>

      {phase !== "graded" && (
        <Button
          variant="pushSuccess"
          size="sm"
          onClick={submit}
          disabled={!allAnswered || phase === "submitting"}
          aria-disabled={!allAnswered || phase === "submitting"}
        >
          {failedToSave ? (
            <span className="flex items-center gap-1.5">
              <ArrowClockwise size={15} weight="bold" aria-hidden="true" />
              {t("retry")}
            </span>
          ) : (
            t("submit")
          )}
        </Button>
      )}
    </section>
  );
}
