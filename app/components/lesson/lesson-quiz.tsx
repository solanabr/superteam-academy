"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ClientQuizQuestion as QuizQuestion } from "@/lib/quiz-questions";

interface LessonQuizProps {
  questions: QuizQuestion[];
  onSubmit: (answers: number[]) => void;
  submitting: boolean;
}

export function LessonQuiz({ questions, onSubmit, submitting }: LessonQuizProps) {
  const t = useTranslations("enrollment");
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));

  return (
    <div className="rounded-2xl border border-edge bg-card p-6">
      <h3 className="mb-4 text-lg font-bold text-content">{t("quizTitle")}</h3>
      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="mb-2 text-sm text-content-secondary">{q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => {
                    const newA = [...answers];
                    newA[qi] = oi;
                    setAnswers(newA);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    answers[qi] === oi
                      ? "border-solana-purple bg-solana-purple/10 text-content"
                      : "border-edge text-content-secondary hover:border-edge"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onSubmit(answers)}
        disabled={answers.includes(-1) || submitting}
        className="mt-6 w-full rounded-lg bg-solana-gradient py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? t("completing") : t("submitAnswers")}
      </button>
    </div>
  );
}
