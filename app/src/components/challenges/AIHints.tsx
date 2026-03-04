"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, HelpCircle } from "lucide-react";

// Hint levels in order of increasing detail
const HINT_LEVEL_LABELS = ["nudge", "approach", "solutionGuide"] as const;
type HintLevelKey = (typeof HINT_LEVEL_LABELS)[number];

// Fallback hints when CMS has none, keyed by language + difficulty
function getGenericHints(language: "ts" | "rust", difficulty: 1 | 2 | 3): string[] {
  const langLabel = language === "ts" ? "TypeScript" : "Rust";

  const nudge = `Break the problem into smaller parts. What does the function need to return?`;
  const approach =
    difficulty === 1
      ? `Start with the simplest implementation — no edge cases yet. Get the basic case working first.`
      : difficulty === 2
        ? `Think about the data structures involved. Consider what inputs lead to each output, then handle edge cases.`
        : `Consider performance characteristics. In ${langLabel}, think about ownership and borrowing for Rust, or type inference for TypeScript.`;
  const guide = `Review the starter code comments for clues. Look at the test cases — each one tells you what the function must do. Work backwards from the expected outputs.`;

  return [nudge, approach, guide];
}

interface AIHintsProps {
  hints: string[]; // Hints from Sanity CMS (may be empty)
  language: "ts" | "rust";
  difficulty: 1 | 2 | 3;
}

export function AIHints({ hints, language, difficulty }: AIHintsProps) {
  const t = useTranslations("challenge.hints");
  const [revealedCount, setRevealedCount] = useState(0);

  // Use CMS hints if available, otherwise generate generic ones
  const effectiveHints = hints.length > 0 ? hints : getGenericHints(language, difficulty);
  const totalHints = effectiveHints.length;

  const levelKey = (index: number): HintLevelKey => {
    return HINT_LEVEL_LABELS[index] ?? "solutionGuide";
  };

  const levelVariant = (index: number): "outline" | "secondary" | "default" => {
    if (index === 0) return "outline";
    if (index === 1) return "secondary";
    return "default";
  };

  const handleRevealNext = () => {
    if (revealedCount < totalHints) {
      setRevealedCount((prev) => prev + 1);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="ai-hints" className="border-amber-500/30">
        <AccordionTrigger className="text-sm hover:no-underline gap-2 px-0">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>{t("title")}</span>
            {revealedCount > 0 && (
              <Badge variant="outline" className="ml-1 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                {t("usedHints", { count: revealedCount, total: totalHints })}
              </Badge>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="space-y-3 pt-1">
            {/* Unrevealed state prompt */}
            {revealedCount === 0 && (
              <p className="text-xs text-muted-foreground italic">{t("thinkFirst")}</p>
            )}

            {/* Revealed hints */}
            {effectiveHints.slice(0, revealedCount).map((hint, index) => (
              <div
                key={index}
                className="rounded-md border border-border/60 bg-muted/40 p-3 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                  <Badge variant={levelVariant(index)} className="text-xs">
                    {t(levelKey(index))}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pl-5">{hint}</p>
              </div>
            ))}

            {/* Reveal next / no more hints */}
            {revealedCount < totalHints ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevealNext}
                className="w-full gap-1.5 border-amber-500/40 text-amber-600 hover:text-amber-700 hover:border-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                aria-label={t("getNextHint")}
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                {t("getNextHint")}
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-1">{t("noMoreHints")}</p>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
