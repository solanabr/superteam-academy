"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const QUESTION_IDS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;
const OPTION_IDS = ["a", "b", "c", "d"] as const;

interface AssessmentStepProps {
  answers: Record<string, string>;
  onAnswer: (questionId: string, optionId: string) => void;
}

export function AssessmentStep({ answers, onAnswer }: AssessmentStepProps) {
  const t = useTranslations("onboarding.assessment");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-2xl font-bold sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-6">
        {QUESTION_IDS.map((qId, qi) => (
          <div key={qId} className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 font-semibold">
              {qi + 1}. {t(`${qId}.question`)}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {OPTION_IDS.map((optId) => {
                const isSelected = answers[qId] === optId;
                return (
                  <button
                    key={optId}
                    type="button"
                    onClick={() => onAnswer(qId, optId)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border-2 p-3 text-left text-sm transition-all duration-200",
                      "hover:shadow-sm hover:-translate-y-0.5",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-muted-foreground"
                      )}
                    >
                      {optId.toUpperCase()}
                    </span>
                    <span>{t(`${qId}.${optId}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
