"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ChevronRight, Trophy, ArrowRight, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type CourseQuiz, type QuizQuestion } from "@/lib/quiz-data";
import { cn } from "@/lib/utils";

interface QuizModalProps {
    quiz: CourseQuiz;
    courseName: string;
    onClose: () => void;
}

type Phase = "quiz" | "results" | "completion";

export function QuizModal({ quiz, courseName, onClose }: QuizModalProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("quiz");
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [answers, setAnswers] = useState<(number | null)[]>(
        Array(quiz.questions.length).fill(null)
    );
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState(0);

    // Lock body scroll while modal open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const question: QuizQuestion = quiz.questions[currentQ];
    const total = quiz.questions.length;
    const isLast = currentQ === total - 1;
    const passed = score >= Math.ceil(total * 0.7); // 70% pass mark

    function handleSelect(idx: number) {
        if (revealed) return;
        setSelected(idx);
    }

    function handleConfirm() {
        if (selected === null) return;
        setRevealed(true);
        const newAnswers = [...answers];
        newAnswers[currentQ] = selected;
        setAnswers(newAnswers);
        if (selected === question.correctIndex) {
            setScore((s) => s + 1);
        }
    }

    function handleNext() {
        if (isLast) {
            setPhase("results");
        } else {
            setCurrentQ((q) => q + 1);
            setSelected(null);
            setRevealed(false);
        }
    }

    function handleRetry() {
        setPhase("quiz");
        setCurrentQ(0);
        setSelected(null);
        setAnswers(Array(quiz.questions.length).fill(null));
        setRevealed(false);
        setScore(0);
    }

    function handleNextCourse() {
        onClose();
        if (quiz.nextCourseSlug) {
            router.push(`/courses/${quiz.nextCourseSlug}`);
        } else {
            router.push("/courses");
        }
    }

    function handleViewDashboard() {
        onClose();
        router.push("/dashboard");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={phase === "quiz" ? undefined : onClose}
            />

            {/* Modal panel */}
            <div className="relative z-10 w-full max-w-lg rounded-3xl border-4 border-border bg-background shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <span className="font-game text-yellow-400 text-sm">📝 Knowledge Check</span>
                        <span className="text-muted-foreground text-sm font-game">— {courseName}</span>
                    </div>
                    {phase !== "quiz" && (
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* QUIZ PHASE */}
                {phase === "quiz" && (
                    <div className="p-5 sm:p-6 space-y-5">
                        {/* Progress */}
                        <div className="flex items-center justify-between">
                            <span className="font-game text-sm text-muted-foreground">
                                Question {currentQ + 1} of {total}
                            </span>
                            <div className="flex gap-1">
                                {quiz.questions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-2 w-6 rounded-full transition-colors",
                                            i < currentQ
                                                ? answers[i] === quiz.questions[i].correctIndex
                                                    ? "bg-green-500"
                                                    : "bg-red-500"
                                                : i === currentQ
                                                    ? "bg-yellow-400"
                                                    : "bg-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Question */}
                        <h2 className="font-game text-lg sm:text-xl leading-snug">
                            {question.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-2">
                            {question.options.map((opt, i) => {
                                const isCorrect = i === question.correctIndex;
                                const isSelected = i === selected;
                                let style = "border-border bg-card hover:bg-accent hover:border-yellow-400/40";
                                if (revealed) {
                                    if (isCorrect) style = "border-green-500 bg-green-500/10";
                                    else if (isSelected && !isCorrect) style = "border-red-500 bg-red-500/10";
                                    else style = "border-border bg-card opacity-50";
                                } else if (isSelected) {
                                    style = "border-yellow-400 bg-yellow-400/10";
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(i)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-game text-sm sm:text-base",
                                            style,
                                            !revealed && "cursor-pointer",
                                            revealed && "cursor-default"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 shrink-0">
                                                {revealed && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                {revealed && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-500" />}
                                                {(!revealed || (!isCorrect && !isSelected)) && (
                                                    <span className="h-4 w-4 inline-flex items-center justify-center rounded-full border-2 border-current text-xs font-bold">
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                )}
                                            </span>
                                            <span>{opt}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation (after reveal) */}
                        {revealed && (
                            <div className={cn(
                                "rounded-xl border-2 px-4 py-3 font-game text-sm",
                                selected === question.correctIndex
                                    ? "border-green-500/40 bg-green-500/5 text-green-400"
                                    : "border-red-500/40 bg-red-500/5 text-red-400"
                            )}>
                                <p className="font-semibold mb-1">
                                    {selected === question.correctIndex ? "✓ Correct!" : "✗ Not quite."}</p>
                                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                                    {question.explanation}
                                </p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 pt-1">
                            {!revealed ? (
                                <Button
                                    variant="pixel"
                                    className="font-game"
                                    disabled={selected === null}
                                    onClick={handleConfirm}
                                >
                                    Check Answer
                                </Button>
                            ) : (
                                <Button variant="pixel" className="font-game" onClick={handleNext}>
                                    {isLast ? "See Results" : "Next Question"}
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* RESULTS PHASE */}
                {phase === "results" && (
                    <div className="p-5 sm:p-6 space-y-5 text-center">
                        <div className={cn(
                            "inline-flex h-20 w-20 items-center justify-center rounded-full border-4 mx-auto",
                            passed
                                ? "border-yellow-400 bg-yellow-400/10"
                                : "border-red-500 bg-red-500/10"
                        )}>
                            <Trophy className={cn("h-10 w-10", passed ? "text-yellow-400" : "text-red-400")} />
                        </div>

                        <div>
                            <h2 className="font-game text-2xl sm:text-3xl">
                                {passed ? "You passed! 🎉" : "Not quite there"}
                            </h2>
                            <p className="font-game text-muted-foreground mt-1">
                                You got {score} out of {total} correct
                                {passed ? "" : ` (need ${Math.ceil(total * 0.7)} to pass)`}
                            </p>
                        </div>

                        {/* Per-question breakdown */}
                        <div className="space-y-1 text-left">
                            {quiz.questions.map((q, i) => {
                                const correct = answers[i] === q.correctIndex;
                                return (
                                    <div key={q.id} className="flex items-start gap-2 text-sm font-game">
                                        {correct
                                            ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                                        <span className={cn(correct ? "text-foreground" : "text-muted-foreground line-through")}>
                                            {q.question.slice(0, 60)}{q.question.length > 60 ? "…" : ""}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                            {!passed && (
                                <Button
                                    variant="outline"
                                    className="font-game flex-1"
                                    onClick={handleRetry}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Retry Quiz
                                </Button>
                            )}
                            {passed && (
                                <Button
                                    variant="pixel"
                                    className="font-game flex-1"
                                    onClick={() => setPhase("completion")}
                                >
                                    Continue
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            )}
                            {!passed && (
                                <Button
                                    variant="ghost"
                                    className="font-game flex-1"
                                    onClick={handleViewDashboard}
                                >
                                    Back to Dashboard
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* COMPLETION PHASE */}
                {phase === "completion" && (
                    <div className="p-5 sm:p-6 space-y-5 text-center">
                        {/* Pixel art celebration */}
                        <div className="relative flex items-center justify-center py-4">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-28 w-28 rounded-full bg-yellow-400/10 blur-2xl" />
                            </div>
                            <span className="text-7xl relative z-10 animate-bounce">🏆</span>
                        </div>

                        <div>
                            <h2 className="font-game text-2xl sm:text-3xl text-yellow-400">
                                Course Complete!
                            </h2>
                            <p className="font-game text-muted-foreground mt-2 text-sm sm:text-base">
                                You&apos;ve mastered <span className="text-foreground">{courseName}</span>.
                                Your credentials are on-chain — time to level up.
                            </p>
                        </div>

                        {/* Score badge */}
                        <div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow-400/40 bg-yellow-400/10 px-5 py-2 font-game text-yellow-400">
                            <Trophy className="h-4 w-4" />
                            {score}/{total} correct on the assessment
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col gap-2 pt-2">
                            {quiz.nextCourseSlug && (
                                <Button
                                    variant="pixel"
                                    size="lg"
                                    className="font-game text-lg w-full"
                                    onClick={handleNextCourse}
                                >
                                    Next: {quiz.nextCourseTitle}
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            )}
                            <Button
                                variant={quiz.nextCourseSlug ? "ghost" : "pixel"}
                                size={quiz.nextCourseSlug ? "default" : "lg"}
                                className="font-game w-full"
                                onClick={handleViewDashboard}
                            >
                                {quiz.nextCourseSlug ? "Back to Dashboard" : "View Dashboard"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
