"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
    CheckCircle2,
    XCircle,
    Timer,
    Trophy,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/types";

interface InteractiveQuizProps {
    quiz: Quiz;
    onComplete?: (passed: boolean, score: number, total: number) => void;
}

type QuizState = "idle" | "active" | "submitted";

export function InteractiveQuiz({ quiz, onComplete }: InteractiveQuizProps) {
    const { questions, timerSeconds, xpReward, isRequired } = quiz;
    const [state, setState] = useState<QuizState>("idle");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>(
        () => new Array(questions.length).fill(null)
    );
    const [timeLeft, setTimeLeft] = useState(timerSeconds ?? 0);
    const [showXp, setShowXp] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const totalQuestions = questions.length;

    // --- Timer Logic ---
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleSubmit = useCallback(() => {
        clearTimer();
        setState("submitted");

        const score = answers.reduce<number>((acc, answer, idx) => {
            return acc + (answer === questions[idx].correctOptionIndex ? 1 : 0);
        }, 0);

        const passed = score === totalQuestions;

        if (passed) {
            // Confetti burst
            const end = Date.now() + 2500;
            const frame = () => {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ["#ffd23f", "#14F195", "#9945FF"],
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ["#ffd23f", "#14F195", "#9945FF"],
                });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();

            if (xpReward && xpReward > 0) {
                setShowXp(true);
            }
        }

        onComplete?.(passed, score, totalQuestions);
    }, [answers, questions, totalQuestions, xpReward, onComplete, clearTimer]);

    useEffect(() => {
        if (state !== "active" || !timerSeconds) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return clearTimer;
    }, [state, timerSeconds, handleSubmit, clearTimer]);

    const startQuiz = () => {
        setAnswers(new Array(questions.length).fill(null));
        setCurrentQuestion(0);
        setTimeLeft(timerSeconds ?? 0);
        setShowXp(false);
        setState("active");
    };

    const selectAnswer = (optionIndex: number) => {
        if (state !== "active") return;
        const updated = [...answers];
        updated[currentQuestion] = optionIndex;
        setAnswers(updated);
    };

    const goNext = () => {
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion((prev) => prev + 1);
        }
    };

    const goPrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion((prev) => prev - 1);
        }
    };

    const score = answers.reduce<number>((acc, answer, idx) => {
        return acc + (answer === questions[idx].correctOptionIndex ? 1 : 0);
    }, 0);
    const passed = score === totalQuestions;

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    // --- Idle State ---
    if (state === "idle") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-solana-purple to-solana-green">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-display text-lg font-bold">Knowledge Check</h3>
                        <p className="text-sm text-muted-foreground">
                            {totalQuestions} question{totalQuestions > 1 ? "s" : ""}
                            {timerSeconds ? ` · ${formatTime(timerSeconds)} time limit` : ""}
                            {xpReward ? ` · +${xpReward} XP` : ""}
                        </p>
                    </div>
                </div>
                {isRequired && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>This quiz is required to complete the lesson.</span>
                    </div>
                )}
                <Button
                    onClick={startQuiz}
                    className="w-full gap-2 rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white hover:brightness-110"
                >
                    Start Quiz
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </motion.div>
        );
    }

    // --- Submitted State ---
    if (state === "submitted") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm"
            >
                <div className="text-center mb-6 relative">
                    <AnimatePresence>
                        {showXp && (
                            <motion.div
                                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                                animate={{ opacity: 1, y: -30, scale: 1.2 }}
                                exit={{ opacity: 0 }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1.5 bg-gradient-to-r from-solana-purple to-solana-green text-white font-bold rounded-full shadow-xl z-50 pointer-events-none"
                            >
                                +{xpReward} XP!
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div
                        className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-solana-green/10" : "bg-destructive/10"
                            }`}
                    >
                        {passed ? (
                            <CheckCircle2 className="h-8 w-8 text-solana-green" />
                        ) : (
                            <XCircle className="h-8 w-8 text-destructive" />
                        )}
                    </div>
                    <h3 className="mt-3 font-display text-xl font-bold">
                        {passed ? "Quiz Passed!" : "Not Quite..."}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        You scored {score}/{totalQuestions}
                    </p>
                </div>

                {/* Review answers */}
                <div className="space-y-4 mb-6">
                    {questions.map((q, qIdx) => {
                        const userAnswer = answers[qIdx];
                        const isCorrect = userAnswer === q.correctOptionIndex;
                        return (
                            <div key={qIdx} className="rounded-lg border border-border p-4">
                                <div className="flex items-start gap-2 mb-2">
                                    {isCorrect ? (
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-solana-green shrink-0" />
                                    ) : (
                                        <XCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                                    )}
                                    <p className="text-sm font-medium">{q.question}</p>
                                </div>
                                <div className="ml-6 space-y-1">
                                    {q.options.map((opt, optIdx) => {
                                        let optClass = "text-muted-foreground";
                                        if (optIdx === q.correctOptionIndex) {
                                            optClass = "text-solana-green font-medium";
                                        } else if (optIdx === userAnswer && !isCorrect) {
                                            optClass = "text-destructive line-through";
                                        }
                                        return (
                                            <p key={optIdx} className={`text-xs ${optClass}`}>
                                                {String.fromCharCode(65 + optIdx)}. {opt}
                                                {optIdx === q.correctOptionIndex && " ✓"}
                                            </p>
                                        );
                                    })}
                                </div>
                                {q.explanation && (
                                    <p className="mt-2 ml-6 text-xs text-muted-foreground italic border-l-2 border-solana-purple/30 pl-2">
                                        {q.explanation}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!passed && (
                    <Button
                        onClick={startQuiz}
                        variant="outline"
                        className="w-full gap-2 rounded-full"
                    >
                        Try Again
                    </Button>
                )}
            </motion.div>
        );
    }

    // --- Active State ---
    const q = questions[currentQuestion];
    const timerPercent = timerSeconds ? (timeLeft / timerSeconds) * 100 : 100;
    const isTimerDanger = timerSeconds ? timeLeft <= Math.ceil(timerSeconds * 0.2) : false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm"
        >
            {/* Timer bar */}
            {timerSeconds && (
                <div className="mb-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`flex items-center gap-1 font-medium ${isTimerDanger ? "text-destructive" : "text-muted-foreground"}`}>
                            <Timer className="h-3 w-3" />
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-muted-foreground">
                            {currentQuestion + 1}/{totalQuestions}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent">
                        <motion.div
                            className={`h-full rounded-full transition-all ${isTimerDanger
                                ? "bg-destructive"
                                : "bg-gradient-to-r from-solana-purple to-solana-green"
                                }`}
                            initial={false}
                            animate={{ width: `${timerPercent}%` }}
                            transition={{ duration: 0.8 }}
                        />
                    </div>
                </div>
            )}

            {/* Question Header */}
            {!timerSeconds && (
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="font-medium">Question {currentQuestion + 1} of {totalQuestions}</span>
                </div>
            )}

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="text-sm font-semibold mb-4">{q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((option, optIdx) => {
                            const isSelected = answers[currentQuestion] === optIdx;
                            return (
                                <button
                                    key={optIdx}
                                    onClick={() => selectAnswer(optIdx)}
                                    className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-all ${isSelected
                                        ? "border-solana-purple bg-solana-purple/10 text-foreground font-medium"
                                        : "border-border hover:border-solana-purple/40 hover:bg-accent/50 text-muted-foreground"
                                        }`}
                                >
                                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full border text-[10px] font-bold mr-2 ${isSelected ? "border-solana-purple bg-solana-purple text-white" : "border-muted-foreground/30"
                                        }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goPrev}
                    disabled={currentQuestion === 0}
                    className="text-xs"
                >
                    Previous
                </Button>
                <div className="flex gap-1">
                    {questions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentQuestion(i)}
                            className={`h-2 w-2 rounded-full transition-all ${i === currentQuestion
                                ? "bg-solana-purple w-4"
                                : answers[i] !== null
                                    ? "bg-solana-green"
                                    : "bg-accent"
                                }`}
                        />
                    ))}
                </div>
                {currentQuestion < totalQuestions - 1 ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goNext}
                        className="text-xs gap-1"
                    >
                        Next <ChevronRight className="h-3 w-3" />
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={handleSubmit}
                        className="gap-1 rounded-full bg-gradient-to-r from-solana-purple to-solana-green text-white text-xs hover:brightness-110"
                    >
                        Submit
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
