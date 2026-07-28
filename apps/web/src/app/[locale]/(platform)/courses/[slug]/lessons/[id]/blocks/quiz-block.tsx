"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Robot,
  XCircle,
} from "@phosphor-icons/react";
import type { QuizBlockData, QuizQuestionData } from "@superteam-lms/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackQuizChecked } from "@/lib/analytics/events";
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
 *
 * Presentation is a STEPPER (#849): one question per card with prev/next
 * navigation (buttons + arrow keys), so long quizzes never render as a wall.
 * All per-question state lives in maps keyed by question id, so answers,
 * verdicts, and feedback survive navigating away and back. Single-question
 * quizzes render without any stepper chrome.
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
  const [index, setIndex] = useState(0);
  const promptRef = useRef<HTMLLegendElement>(null);
  // True only between a user-initiated navigation and the focus effect below —
  // keeps mount (and unrelated re-renders) from stealing focus.
  const navigatedRef = useRef(false);

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

  const check = useCallback(
    (q: QuizQuestionData, chosen: string[]) => {
      if (chosen.length === 0) return;
      const correct = isChoiceCorrect(q, chosen);
      setResults((prev) => ({
        ...prev,
        [q.id]: { chosen, correct },
      }));
      setCheckedEver((prev) => (prev[q.id] ? prev : { ...prev, [q.id]: true }));
      // #836: quiz correctness is not persisted server-side; this event is its
      // only analytics trail (PostHog/GA4, silent no-op when unconfigured).
      trackQuizChecked({
        lessonId: ctx.lesson._id,
        courseId: ctx.courseId,
        questionId: q.id,
        correct,
      });
    },
    [ctx.lesson._id, ctx.courseId]
  );

  const total = b.questions.length;
  // Stepper chrome (position chip, prev/next, arrow-key nav) only exists when
  // there is something to step through (#849).
  const stepper = total > 1;
  const current = Math.min(index, Math.max(total - 1, 0));
  const q = b.questions[current];

  const goTo = (target: number): void => {
    if (target < 0 || target >= total || target === current) return;
    navigatedRef.current = true;
    setIndex(target);
  };

  // Card changed via prev/next/arrows — move focus to the question heading so
  // keyboard and screen-reader users land on the new question, not in a void.
  useEffect(() => {
    if (!navigatedRef.current) return;
    navigatedRef.current = false;
    promptRef.current?.focus();
  }, [current]);

  const onBodyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!q) return;
    const tag = (event.target as HTMLElement).tagName;
    if (event.key === "Enter") {
      // Buttons handle Enter natively (prev/next/check/collapse) — anywhere
      // else in the card, Enter checks the current question.
      if (tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
      const chosen = selections[q.id] ?? [];
      if (chosen.length === 0) return;
      event.preventDefault();
      check(q, chosen);
      return;
    }
    if (!stepper) return;
    // Inside the radio/checkbox group the arrow keys move the SELECTION —
    // native group behavior stays untouched; navigation arrows apply elsewhere.
    if (tag === "INPUT") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(current - 1);
    }
  };

  // Collapsed summary (#770): how many questions are currently answered
  // correctly. Turns green only at a clean sweep, so the badge doubles as the
  // "done" signal when the section is folded away.
  const correctCount = b.questions.filter((q) => results[q.id]?.correct).length;
  const allCorrect = correctCount === total;

  const multi = q?.multiSelect ?? false;
  const chosen = q ? (selections[q.id] ?? []) : [];
  const result: CheckResult | undefined = q ? results[q.id] : undefined;
  const chosenWithFeedback =
    q && result
      ? q.options.filter((o) => result.chosen.includes(o.id) && o.feedback)
      : [];

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
        {stepper && (
          <span className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums text-text-3 [background:var(--input)]">
            {t("quizPosition", { current: current + 1, total })}
          </span>
        )}
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
            total,
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

      <div
        className={cn("space-y-6 px-5 pb-5", !open && "hidden")}
        onKeyDown={onBodyKeyDown}
      >
        {/* Always-mounted position announcer: navigation swaps the card, so a
            separate live region tells screen readers where they landed. */}
        {stepper && (
          <p aria-live="polite" className="sr-only">
            {t("quizPosition", { current: current + 1, total })}
          </p>
        )}
        {q && (
          <fieldset key={q.id} className="space-y-2">
            <legend
              ref={promptRef}
              tabIndex={-1}
              className="rounded-sm font-display font-bold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
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
                      <CheckCircle size={16} weight="bold" aria-hidden="true" />
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
        )}

        {stepper && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-disabled={current === 0}
            >
              <CaretLeft size={14} weight="bold" aria-hidden="true" />
              {t("quizPrev")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo(current + 1)}
              disabled={current === total - 1}
              aria-disabled={current === total - 1}
            >
              {t("quizNext")}
              <CaretRight size={14} weight="bold" aria-hidden="true" />
            </Button>
          </div>
        )}

        {/* The AI Partner is suppressed while any question is unchecked
            (LX-C1/F18) — retrieval stays AI-free. Say so, so its absence reads
            as a rule rather than a missing feature (#770). */}
        {!allChecked && (
          <p className="flex items-start gap-2 rounded-md border border-border p-3 text-xs text-text-3 [background:var(--input)]">
            <Robot
              size={16}
              weight="duotone"
              className="mt-px shrink-0 text-primary"
              aria-hidden="true"
            />
            {t("quizUnlocksAssistant")}
          </p>
        )}
      </div>
    </div>
  );
}
