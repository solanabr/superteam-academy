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
 *
 * Interaction states (#943): a question that has been checked CORRECT locks —
 * its inputs and its Check button disable, while the correct styling and the
 * explanation stay on screen. Next lights up once the current question is
 * correct, and a clean sweep renders an in-block completion state (no popup,
 * per the three-popup rule).
 */
export function QuizBlock({ block, ctx }: BlockRenderProps) {
  const b = block as QuizBlockData;
  const t = useTranslations("lesson");
  // Device-scoped persistence (owner 2026-07-31): a refresh must not lose the
  // quiz. localStorage, hydrated in an effect — reading it during render would
  // desync the first paint from SSR (hydration mismatch), same rule as the
  // stopwatch. Keyed by lesson AND block: block keys are only stable WITHIN a
  // lesson (packages/types course.ts), so a bare block key can collide across
  // lessons.
  const storageKey = `quiz-state:${ctx.lesson._id}:${b.key}`;
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  // Sticky "has been checked at least once" — once feedback + explanation have
  // been revealed, the AI pane has nothing left to spoil (F18 gate below).
  const [checkedEver, setCheckedEver] = useState<Record<string, boolean>>({});
  // False until the post-mount restore has run; the save effect must not write
  // before then or the first (empty) render would wipe the stored state.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const restored = JSON.parse(raw) as {
          selections?: Record<string, string[]>;
          results?: Record<string, CheckResult>;
          checkedEver?: Record<string, boolean>;
        };
        setSelections(restored.selections ?? {});
        setResults(restored.results ?? {});
        setCheckedEver(restored.checkedEver ?? {});
      }
    } catch {
      /* corrupt/blocked storage — start fresh */
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ selections, results, checkedEver })
      );
    } catch {
      /* storage full/blocked — persistence is best-effort */
    }
  }, [hydrated, storageKey, selections, results, checkedEver]);
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

  const doneCorrectCount = b.questions.filter(
    (q) => results[q.id]?.correct
  ).length;
  // Completion gate: this quiz is "done" only when every answer is CORRECT —
  // matching the server's set-equality grading, so the enabled button never
  // lies about what the POST will accept.
  useEffect(() => {
    ctx.setBlockDone(b.key, doneCorrectCount === b.questions.length);
  }, [doneCorrectCount, b.questions.length, b.key, ctx]);

  const answeredCount = b.questions.filter((q) => checkedEver[q.id]).length;
  const allChecked = answeredCount === b.questions.length;
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
    (q: QuizQuestionData, chosen: string[], locked: boolean) => {
      if (chosen.length === 0 || locked) return;
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

  // Collapsed summary (#770): how many questions are currently answered
  // correctly. Turns green only at a clean sweep, so the badge doubles as the
  // "done" signal when the section is folded away.
  const correctCount = b.questions.filter((q) => results[q.id]?.correct).length;
  const allCorrect = total > 0 && correctCount === total;

  // Owner call (2026-07-31): once every question is answered correctly the
  // quiz folds itself — the header chips carry the recap and the AI Partner
  // sits directly underneath. Fires once on the transition, so the learner can
  // still reopen the section manually afterwards.
  const prevAllCorrect = useRef(false);
  useEffect(() => {
    if (allCorrect && !prevAllCorrect.current) setOpen(false);
    prevAllCorrect.current = allCorrect;
  }, [allCorrect]);

  const multi = q?.multiSelect ?? false;
  const chosen = q ? (selections[q.id] ?? []) : [];
  const result: CheckResult | undefined = q ? results[q.id] : undefined;
  const chosenWithFeedback =
    q && result
      ? q.options.filter((o) => result.chosen.includes(o.id) && o.feedback)
      : [];
  // A correct verdict freezes the question (#943): nothing left to change, so
  // inputs and Check disable while the verdict + explanation stay visible.
  const locked = result?.correct ?? false;

  const onBodyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!q) return;
    const tag = (event.target as HTMLElement).tagName;
    if (event.key === "Enter") {
      // Buttons handle Enter natively (prev/next/check/collapse) — anywhere
      // else in the card, Enter checks the current question.
      if (tag === "BUTTON" || tag === "A" || tag === "TEXTAREA") return;
      const chosen = selections[q.id] ?? [];
      if (chosen.length === 0 || locked) return;
      event.preventDefault();
      check(q, chosen, locked);
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
        {/* Count = neutral data chip; state = the ONE colored chip. Both went
            success-green on a sweep and read as duplicate twins. */}
        <span className="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums text-text-3 [background:var(--inset)]">
          {t("quizScore", {
            correct: correctCount,
            total,
          })}
        </span>
        {allCorrect && (
          <span className="flex items-center gap-1 rounded-full border border-[var(--primary-border)] bg-[var(--primary-dim)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.4px] text-primary">
            <CheckCircle size={12} weight="bold" aria-hidden="true" />
            {t("quizCompleteChip")}
          </span>
        )}
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

      {/* Completion state (#943): a clean sweep is acknowledged in-block — no
          popup, per the three-popup rule. It sits OUTSIDE the collapsible body
          on purpose: the same sweep auto-collapses the quiz, and a live-region
          insertion inside a subtree that goes `hidden` in the same frame is
          neither seen nor reliably announced. Always mounted so the region
          exists before the text arrives. */}
      <div aria-live="polite" className="px-5 pb-5 empty:hidden">
        {allCorrect && (
          <p className="flex items-center gap-2 rounded-md border border-[var(--primary-border)] bg-[var(--primary-dim)] p-3 text-sm font-medium text-primary">
            <CheckCircle size={16} weight="bold" aria-hidden="true" />
            {t("quizAllCorrect", { total })}
          </p>
        )}
      </div>

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
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-2 text-sm transition-colors",
                      locked
                        ? "cursor-default"
                        : "cursor-pointer hover:bg-inset",
                      judged
                        ? o.correct
                          ? "border-success"
                          : "border-danger"
                        : "border-border"
                    )}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={q.id}
                      value={o.id}
                      checked={chosen.includes(o.id)}
                      onChange={() => toggle(q.id, o.id, multi)}
                      disabled={locked}
                      className="accent-primary"
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
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
                    <div className="space-y-1 rounded-md border border-border bg-inset p-3">
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

        {/* One action row: Check answer lives in the Next slot and morphs into
            the emphasized Next once the question is correct (owner, 2026-07-31).
            Non-stepper quizzes get the same morphing slot without Prev/Next. */}
        <div className="flex items-center justify-between gap-2">
          {stepper ? (
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
          ) : (
            <span />
          )}
          {locked && stepper && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => goTo(current + 1)}
              disabled={current === total - 1}
              aria-disabled={current === total - 1}
            >
              {t("quizNext")}
              <CaretRight size={14} weight="bold" aria-hidden="true" />
            </Button>
          )}
          {!locked && q && (
            <div className="flex items-center gap-2">
              <Button
                variant="pushSuccess"
                size="sm"
                onClick={() => check(q, chosen, locked)}
                disabled={chosen.length === 0}
                aria-disabled={chosen.length === 0}
              >
                {t("quizCheck")}
              </Button>
              {/* A wrong-but-attempted question can be skipped (subdued Next):
                  the AI gate counts attempts, and nobody dead-ends on a hard
                  question. The primary Next appears only on correct. */}
              {stepper && checkedEver[q.id] && (
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
              )}
            </div>
          )}
        </div>

        {/* The AI Partner is suppressed while any question is unchecked
            (LX-C1/F18) — retrieval stays AI-free. The gate is unchanged; the
            line states it explicitly and counts down (#770, #943). */}
        {!allChecked && (
          <p className="flex items-start gap-2 rounded-md border border-border p-3 text-xs text-text-3 [background:var(--inset)]">
            <Robot
              size={16}
              weight="duotone"
              className="mt-px shrink-0 text-primary"
              aria-hidden="true"
            />
            {t("quizUnlocksAssistant", { answered: answeredCount, total })}
          </p>
        )}
      </div>
    </div>
  );
}
