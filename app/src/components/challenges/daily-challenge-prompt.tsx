"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DailyChallenge } from "@/lib/daily-challenges";

const CATEGORY_COLORS: Record<DailyChallenge["category"], string> = {
  rust: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  anchor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  solana: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tokens: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  defi: "bg-green-500/10 text-green-400 border-green-500/20",
};

const DIFFICULTY_LABELS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLORS: Record<DailyChallenge["difficulty"], string> = {
  beginner: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  intermediate: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
  advanced: "text-red-400 border-red-500/20 bg-red-500/10",
};

export interface DailyChallengePromptProps {
  challenge: DailyChallenge;
  showSolution: boolean;
  onToggleSolution: () => void;
  labels: {
    description: string;
    expectedBehavior: string;
    examples: string;
    input: string;
    output: string;
    hintLabel: string;
    nextHint: string;
    showSolution: string;
    hideSolution: string;
  };
}

export function DailyChallengePrompt({
  challenge,
  showSolution,
  onToggleSolution,
  labels,
}: DailyChallengePromptProps) {
  const [showHints, setShowHints] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="space-y-5 p-5">
        {/* Title + badges */}
        <div>
          <h2 className="mb-2 text-xl font-bold">{challenge.title}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("text-[10px]", CATEGORY_COLORS[challenge.category])}
            >
              {challenge.category}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                DIFFICULTY_COLORS[challenge.difficulty],
              )}
            >
              {DIFFICULTY_LABELS[challenge.difficulty]}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {challenge.language}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labels.description}
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">
            {challenge.description}
          </p>
        </div>

        {/* Expected Behavior */}
        {challenge.expectedBehavior.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.expectedBehavior}
            </h3>
            <ul className="space-y-1.5">
              {challenge.expectedBehavior.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {challenge.examples.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.examples}
            </h3>
            <div className="space-y-2">
              {challenge.examples.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {labels.input}:
                    </span>
                    <code className="font-mono text-foreground">
                      {ex.input}
                    </code>
                  </div>
                  <div className="mt-1 flex items-start gap-2 text-xs">
                    <span className="shrink-0 font-medium text-muted-foreground">
                      {labels.output}:
                    </span>
                    <code className="font-mono text-emerald-400">
                      {ex.output}
                    </code>
                  </div>
                  {ex.explanation && (
                    <p className="mt-1.5 text-[11px] italic text-muted-foreground">
                      {ex.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hints */}
        {challenge.hints.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              onClick={() => setShowHints((h) => !h)}
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                {labels.hintLabel} ({hintIndex + 1}/{challenge.hints.length})
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showHints && "rotate-180",
                )}
              />
            </button>
            {showHints && (
              <div className="border-t border-border px-3 pb-3 pt-2.5">
                <p className="mb-2 text-sm text-muted-foreground">
                  {challenge.hints[hintIndex]}
                </p>
                {hintIndex < challenge.hints.length - 1 && (
                  <button
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() =>
                      setHintIndex((i) =>
                        Math.min(i + 1, challenge.hints.length - 1),
                      )
                    }
                  >
                    {labels.nextHint}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Show/hide solution */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
          onClick={onToggleSolution}
        >
          {showSolution ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> {labels.hideSolution}
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> {labels.showSolution}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
