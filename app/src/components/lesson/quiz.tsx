"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { Quiz } from "@/types";
import { cn } from "@/lib/utils";

interface QuizProps {
  quiz: Quiz;
  onPass: () => void;
}

export function LessonQuiz({ quiz, onPass }: QuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = useCallback(
    (questionId: string, optionIndex: number) => {
      if (submitted) return;
      setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    let correct = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (answers[q.id ?? `__q${i}`] === q.correctIndex) correct++;
    }
    const pct = Math.round((correct / quiz.questions.length) * 100);
    setScore(pct);
    setSubmitted(true);

    if (pct >= quiz.passingScore) {
      onPass();
    }
  }, [quiz, answers, onPass]);

  const handleRetry = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  }, []);

  const allAnswered = quiz.questions.every((q, i) => answers[q.id ?? `__q${i}`] !== undefined);
  const passed = submitted && score >= quiz.passingScore;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5">
        <h3 className="text-lg font-semibold mb-1">Knowledge Check</h3>
        <p className="text-sm text-muted-foreground">
          Answer the questions below to complete this lesson. You need{" "}
          {quiz.passingScore}% to pass.
        </p>
      </div>

      {quiz.questions.map((q, qi) => {
        const qid = q.id ?? `__q${qi}`;
        const selected = answers[qid];
        const isCorrect = submitted && selected === q.correctIndex;
        const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

        return (
          <div
            key={qid}
            className={cn(
              "rounded-lg border p-5 transition-colors",
              isCorrect && "border-emerald-500/50 bg-emerald-500/5",
              isWrong && "border-red-500/50 bg-red-500/5",
            )}
          >
            <p className="font-medium mb-3">
              <span className="text-muted-foreground mr-2">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const showCorrect = submitted && oi === q.correctIndex;
                const showWrong = submitted && isSelected && oi !== q.correctIndex;

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qid, oi)}
                    disabled={submitted}
                    className={cn(
                      "w-full text-left rounded-md border px-4 py-3 text-sm transition-all",
                      "hover:border-primary/40 hover:bg-accent",
                      isSelected && !submitted && "border-primary bg-primary/5",
                      showCorrect && "border-emerald-500 bg-emerald-500/10 font-medium",
                      showWrong && "border-red-500 bg-red-500/10",
                      submitted && !showCorrect && !showWrong && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                          isSelected && !submitted && "border-primary bg-primary text-primary-foreground",
                          showCorrect && "border-emerald-500 bg-emerald-500 text-white",
                          showWrong && "border-red-500 bg-red-500 text-white",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt}</span>
                      {showCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />}
                      {showWrong && <XCircle className="ml-auto h-4 w-4 text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {/* Results / Actions */}
      <div className="flex items-center justify-between rounded-lg border p-5">
        {submitted ? (
          <>
            <div className="flex items-center gap-3">
              {passed ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="font-semibold">
                  {passed ? "Passed!" : "Not quite..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {score}% ({quiz.questions.filter((q, i) => answers[q.id ?? `__q${i}`] === q.correctIndex).length}/
                  {quiz.questions.length} correct)
                </p>
              </div>
            </div>
            {!passed && (
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {allAnswered
                ? "All questions answered. Ready to submit!"
                : `${Object.keys(answers).length}/${quiz.questions.length} answered`}
            </p>
            <Button onClick={handleSubmit} disabled={!allAnswered} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Submit Answers
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
