"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuizType {
    _id: string;
    title?: string;
    passingScore: number;
    questions: Array<{
        _key?: string;
        question: string;
        options: string[];
        correctIndex: number;
        explanation?: string;
    }>;
}

interface QuizProps {
    quiz: QuizType;
    onPass: () => void;
    isSubmitting?: boolean;
}

export function QuizView({ quiz, onPass, isSubmitting = false }: QuizProps) {
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
            const qid = q._key ?? `__q${i}`;
            if (answers[qid] === q.correctIndex) correct++;
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

    const allAnswered = quiz.questions.every((q, i) => answers[q._key ?? `__q${i}`] !== undefined);
    const passed = submitted && score >= quiz.passingScore;

    return (
        <div className="space-y-6 w-full max-w-3xl mx-auto py-8 text-text-primary">
            <div className="rounded-xl border border-white/5 bg-white/5 p-6 glass-panel">
                <h3 className="text-xl font-display font-semibold mb-2">{quiz.title || "Knowledge Check"}</h3>
                <p className="text-sm text-text-secondary">
                    Answer the questions below to complete this module. You need{" "}
                    <span className="text-solana font-bold">{quiz.passingScore}%</span> to pass and earn XP!
                </p>
            </div>

            {quiz.questions.map((q, qi) => {
                const qid = q._key ?? `__q${qi}`;
                const selected = answers[qid];
                const isCorrect = submitted && selected === q.correctIndex;
                const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

                return (
                    <div
                        key={qid}
                        className={cn(
                            "rounded-xl border p-6 transition-all duration-300",
                            !submitted && "border-white/10 bg-white/5 hover:border-white/20",
                            isCorrect && "border-solana/50 bg-solana/5",
                            isWrong && "border-red-500/50 bg-red-500/5",
                        )}
                    >
                        <p className="font-medium mb-4 text-text-primary text-lg">
                            <span className="text-text-muted mr-3 font-mono">{qi + 1}.</span>
                            {q.question}
                        </p>
                        <div className="space-y-3">
                            {q.options.map((opt, oi) => {
                                const isSelected = selected === oi;
                                const showCorrect = submitted && oi === q.correctIndex;
                                const showWrong = submitted && isSelected && oi !== q.correctIndex;

                                return (
                                    <button
                                        key={oi}
                                        onClick={() => handleSelect(qid, oi)}
                                        disabled={submitted || isSubmitting}
                                        className={cn(
                                            "w-full text-left rounded-lg border px-5 py-4 text-sm transition-all",
                                            !submitted && "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 cursor-pointer",
                                            isSelected && !submitted && "border-solana bg-solana/10 shadow-[0_0_15px_rgba(20,241,149,0.15)]",
                                            showCorrect && "border-solana bg-solana/20 font-medium",
                                            showWrong && "border-red-500 bg-red-500/20",
                                            submitted && !showCorrect && !showWrong && "opacity-40 border-white/5 cursor-default",
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span
                                                className={cn(
                                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold font-mono",
                                                    !isSelected && !showCorrect && !showWrong && "border-white/20 text-text-muted",
                                                    isSelected && !submitted && "border-solana bg-solana text-[#0A0A0B]",
                                                    showCorrect && "border-solana bg-solana text-[#0A0A0B]",
                                                    showWrong && "border-red-500 bg-red-500 text-white",
                                                )}
                                            >
                                                {String.fromCharCode(65 + oi)}
                                            </span>
                                            <span className="text-base">{opt}</span>
                                            {showCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-solana drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]" />}
                                            {showWrong && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {submitted && q.explanation && (
                            <p className="mt-5 text-sm text-text-secondary border-t border-white/10 pt-4">
                                <span className="text-solana font-mono mr-2">Explanation:</span>
                                {q.explanation}
                            </p>
                        )}
                    </div>
                );
            })}

            {/* Results / Actions */}
            <div className={cn(
                "flex items-center justify-between rounded-xl border p-6 transition-colors duration-500",
                submitted ? (passed ? "border-solana/30 bg-solana/5" : "border-red-500/30 bg-red-500/5") : "border-white/10 bg-[#0A0A0B]"
            )}>
                {submitted ? (
                    <>
                        <div className="flex items-center gap-4">
                            {passed ? (
                                <CheckCircle2 className="h-8 w-8 text-solana drop-shadow-[0_0_12px_rgba(20,241,149,0.5)]" />
                            ) : (
                                <XCircle className="h-8 w-8 text-red-500" />
                            )}
                            <div>
                                <p className={cn("text-lg font-bold font-display", passed ? "text-solana" : "text-red-500")}>
                                    {passed ? "Knowledge Check Passed!" : "Requires Review"}
                                </p>
                                <p className="text-sm text-text-secondary mt-1">
                                    Score: {score}% ({quiz.questions.filter((q, i) => answers[q._key ?? `__q${i}`] === q.correctIndex).length}/
                                    {quiz.questions.length} correct)
                                </p>
                            </div>
                        </div>
                        {!passed && (
                            <Button onClick={handleRetry} variant="outline" className="gap-2 bg-transparent border-white/20 hover:bg-white/10" disabled={isSubmitting}>
                                <RotateCcw className="h-4 w-4" />
                                Try Again
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <p className="text-sm text-text-secondary">
                            {allAnswered
                                ? "All questions answered. Ready to submit!"
                                : `${Object.keys(answers).length}/${quiz.questions.length} answered`}
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={!allAnswered || isSubmitting}
                            className={cn("gap-2 shadow-[0_0_15px_rgba(20,241,149,0.2)]", isSubmitting ? "opacity-50" : "")}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {isSubmitting ? "Submitting..." : "Submit Answers"}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
