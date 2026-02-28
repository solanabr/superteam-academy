"use client";

import { Code, Lightbulb, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { TestRunner } from "./test-runner";
import type { Challenge, TestCase } from "@/types";

export interface ChallengePromptProps {
  title: string;
  description: string;
  challenge: Challenge;
  testResults: TestCase[];
  showHints: boolean;
  onToggleHints: () => void;
  currentHintIndex: number;
  onNextHint: () => void;
  showSolution: boolean;
  onShowSolution: () => void;
  compact?: boolean;
}

export function ChallengePrompt({
  title,
  description,
  challenge,
  testResults,
  showHints,
  onToggleHints,
  currentHintIndex,
  onNextHint,
  showSolution,
  onShowSolution,
  compact = false,
}: ChallengePromptProps) {
  const t = useTranslations("lesson");
  const textSize = compact ? "text-xs" : "text-sm";
  const headingSize = compact ? "text-xl" : "text-2xl";
  const hintPadding = compact ? "p-2.5" : "p-3";

  return (
    <div>
      <span className="inline-flex items-center gap-1 rounded-full bg-brazil-gold/10 px-2.5 py-0.5 text-xs font-medium text-brazil-gold">
        <Code className="h-3 w-3" />
        {t("challenge.title")}
      </span>

      <h1 className={`mt-3 font-heading ${headingSize} font-bold`}>{title}</h1>
      <p className={`mt-2 ${compact ? "text-sm" : ""} text-muted-foreground`}>
        {description}
      </p>

      <div className={compact ? "mt-4" : "mt-6"}>
        {!compact && (
          <h2 className="font-heading text-lg font-semibold">{t("challenge.title")}</h2>
        )}
        <div
          className={`${compact ? "mt-0" : "mt-3"} rounded-lg border border-border bg-muted/30 ${compact ? "p-3" : "p-4"} ${textSize} leading-relaxed`}
        >
          {challenge.prompt}
        </div>
      </div>

      <div className={compact ? "mt-4" : "mt-6"}>
        {!compact && (
          <h2 className="mb-3 font-heading text-lg font-semibold">
            {t("expectedBehavior")}
          </h2>
        )}
        <TestRunner
          testResults={testResults}
          variant={compact ? "compact" : "inline"}
        />
      </div>

      <div className={`${compact ? "mt-4 space-y-2" : "mt-6 space-y-3"}`}>
        <button
          onClick={onToggleHints}
          className={`flex items-center gap-1.5 ${textSize} text-muted-foreground transition-colors hover:text-foreground`}
        >
          <Lightbulb
            className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} text-brazil-gold`}
          />
          {showHints
            ? t("challenge.hideHints")
            : t("challenge.showHintsCount", { count: challenge.hints.length })}
        </button>
        {showHints && (
          <div className={compact ? "space-y-1.5" : "space-y-2"}>
            {challenge.hints.slice(0, currentHintIndex + 1).map((hint, i) => (
              <div
                key={i}
                className={`rounded-lg border border-brazil-gold/20 bg-brazil-gold/5 ${hintPadding} ${textSize}`}
              >
                <span className="font-medium text-brazil-gold">
                  {t("challenge.hintNumber", { number: i + 1 })}
                </span>{" "}
                {hint}
              </div>
            ))}
            {currentHintIndex < challenge.hints.length - 1 && (
              <button
                onClick={onNextHint}
                className="text-xs text-brazil-gold hover:underline"
              >
                {t("challenge.showNextHint")}
              </button>
            )}
          </div>
        )}
        <button
          onClick={onShowSolution}
          className={`flex items-center gap-1.5 ${textSize} text-muted-foreground transition-colors hover:text-foreground`}
        >
          {showSolution ? (
            <EyeOff className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          ) : (
            <Eye className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          )}
          {showSolution ? t("challenge.solutionApplied") : t("solution")}
        </button>
      </div>
    </div>
  );
}
