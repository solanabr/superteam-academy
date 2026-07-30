"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, XCircle, ArrowClockwise } from "@phosphor-icons/react";
import {
  trackTestOutStarted,
  trackTestOutGraded,
} from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";

interface ChallengeQuestion {
  id: string;
  prompt: string;
  multiSelect: boolean;
  options: { id: string; label: string }[];
}

interface ChallengePayload {
  courseId: string;
  count: number;
  passRatio: number;
  questions: ChallengeQuestion[];
}

interface PassResult {
  passed: true;
  correct: number;
  total: number;
  next: string;
}
interface FailResult {
  passed: false;
  correct: number;
  total: number;
  required: number;
}
type SubmitResult = PassResult | FailResult;

type Phase = "loading" | "answering" | "submitting" | "graded" | "error";

interface TestOutChallengeProps {
  courseId: string;
  locale: string;
}

/**
 * The segment-2 test-out challenge (LX-A5). Loads the deterministic question set
 * (answer key stripped) and submits selections for SERVER-authoritative grading
 * (`/api/courses/test-out`). On a pass the server has already batch-completed the
 * course's lessons and returns the onward route, which we navigate to. On a fail
 * the learner may retry (the same set re-loads).
 */
export function TestOutChallenge({ courseId, locale }: TestOutChallengeProps) {
  const t = useTranslations("testOut");
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [challenge, setChallenge] = useState<ChallengePayload | null>(null);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [failedToSubmit, setFailedToSubmit] = useState(false);

  const load = useCallback(async () => {
    setPhase("loading");
    setSelections({});
    setResult(null);
    setFailedToSubmit(false);
    try {
      const res = await fetch(
        `/api/courses/test-out?courseId=${encodeURIComponent(courseId)}`
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as ChallengePayload;
      setChallenge(data);
      setPhase("answering");
      // Fires on a successful LOAD, not on mount: a failed fetch leaves the
      // learner on an error card with nothing to attempt, and counting that as
      // a start would understate the pass rate (#871).
      trackTestOutStarted({ courseId });
    } catch {
      setPhase("error");
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(
    (question: ChallengeQuestion, optionId: string) => {
      setSelections((prev) => {
        const current = prev[question.id] ?? [];
        const next = question.multiSelect
          ? current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId]
          : [optionId];
        return { ...prev, [question.id]: next };
      });
    },
    []
  );

  const allAnswered =
    challenge?.questions.every((q) => (selections[q.id]?.length ?? 0) > 0) ??
    false;

  const submit = useCallback(async () => {
    if (!challenge) return;
    setPhase("submitting");
    setFailedToSubmit(false);
    try {
      const res = await fetch("/api/courses/test-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, selections, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SubmitResult;
      setResult(data);
      setPhase("graded");
      trackTestOutGraded({
        courseId,
        passed: data.passed,
        correct: data.correct,
        total: data.total,
      });
      if (data.passed) {
        // The server has already completed the lessons; send the learner onward.
        router.push(data.next);
      }
    } catch {
      setFailedToSubmit(true);
      setPhase("answering");
    }
  }, [challenge, courseId, selections, locale, router]);

  if (phase === "loading") {
    return (
      <p className="text-sm text-text-3" role="status">
        {t("loading")}
      </p>
    );
  }

  if (phase === "error" || !challenge) {
    return (
      <div className="space-y-3" role="alert">
        <p className="text-sm text-danger">{t("loadError")}</p>
        <Button variant="push" size="sm" onClick={() => void load()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const graded = phase === "graded";
  const passed = graded && result?.passed === true;

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-3">
        {t("intro", {
          count: challenge.count,
          required: requiredCount(challenge),
        })}
      </p>

      {challenge.questions.map((q, i) => {
        const chosen = selections[q.id] ?? [];
        return (
          <fieldset
            key={q.id}
            disabled={graded || phase === "submitting"}
            className="space-y-2 rounded-[var(--r-lg)] border-[2.5px] border-border bg-card p-5 shadow-card"
          >
            <legend className="font-display font-bold text-text">
              <span className="mr-2 font-mono text-xs text-text-3">
                {t("questionNumber", { n: i + 1, total: challenge.count })}
              </span>
              {q.prompt}
            </legend>
            <div className="space-y-1.5">
              {q.options.map((o) => {
                const isChosen = chosen.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-subtle ${
                      isChosen ? "border-primary" : "border-border"
                    } ${graded ? "cursor-default" : ""}`}
                  >
                    <input
                      type={q.multiSelect ? "checkbox" : "radio"}
                      name={q.id}
                      value={o.id}
                      checked={isChosen}
                      onChange={() => toggle(q, o.id)}
                      className="accent-primary"
                    />
                    <span>{o.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div aria-live="polite" className="space-y-2">
        {graded && result && (
          <div
            className={`space-y-1 rounded-[var(--r-lg)] border-[2.5px] p-4 ${
              passed ? "border-success" : "border-danger"
            }`}
          >
            <p
              className={`flex items-center gap-1.5 font-display text-base font-black ${
                passed ? "text-success" : "text-danger"
              }`}
            >
              {passed ? (
                <CheckCircle size={18} weight="bold" aria-hidden="true" />
              ) : (
                <XCircle size={18} weight="bold" aria-hidden="true" />
              )}
              {passed ? t("passedTitle") : t("failedTitle")}
            </p>
            <p className="text-sm text-text-3">
              {t("score", { correct: result.correct, total: result.total })}
            </p>
            <p className="text-sm text-text">
              {passed ? t("passedBody") : t("failedBody")}
            </p>
          </div>
        )}
        {failedToSubmit && (
          <p className="flex items-center gap-1.5 text-sm text-danger">
            <XCircle size={16} weight="bold" aria-hidden="true" />
            {t("submitError")}
          </p>
        )}
      </div>

      {!passed &&
        (graded ? (
          <Button variant="push" size="sm" onClick={() => void load()}>
            <span className="flex items-center gap-1.5">
              <ArrowClockwise size={15} weight="bold" aria-hidden="true" />
              {t("tryAgain")}
            </span>
          </Button>
        ) : (
          <Button
            variant="pushSuccess"
            size="sm"
            onClick={submit}
            disabled={!allAnswered || phase === "submitting"}
            aria-disabled={!allAnswered || phase === "submitting"}
          >
            {failedToSubmit ? (
              <span className="flex items-center gap-1.5">
                <ArrowClockwise size={15} weight="bold" aria-hidden="true" />
                {t("retry")}
              </span>
            ) : phase === "submitting" ? (
              t("submitting")
            ) : (
              t("submit")
            )}
          </Button>
        ))}
    </div>
  );
}

/** Correct answers needed to pass, from the count + ratio the server returned. */
function requiredCount(challenge: ChallengePayload): number {
  return Math.ceil(challenge.count * challenge.passRatio);
}
