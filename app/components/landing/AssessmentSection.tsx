"use client";

import { motion, useInView, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, BookOpen, Trophy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Question {
    question: string;
    options: string[];
    /** Higher score = more advanced recommendation */
    scores: number[];
}

const QUESTIONS: Question[] = [
    {
        question: "How comfortable are you with Rust?",
        options: [
            "Never used Rust",
            "Know basics — syntax and ownership",
            "Comfortable writing programs",
            "Confident with advanced Rust concepts",
        ],
        scores: [0, 1, 2, 3],
    },
    {
        question: "What's your experience with blockchain development?",
        options: [
            "Complete beginner",
            "Understand basic concepts — wallets, transactions",
            "Built on other chains like Ethereum",
            "Have Solana development experience",
        ],
        scores: [0, 1, 2, 3],
    },
    {
        question: "What do you want to build on Solana?",
        options: [
            "DeFi protocols",
            "NFT / digital collectible platforms",
            "DAOs & governance tools",
            "Infrastructure & developer tools",
        ],
        scores: [2, 1, 1, 2],
    },
    {
        question: "How do you prefer to learn?",
        options: [
            "Step-by-step tutorials",
            "Project-based learning",
            "Reading documentation",
            "Code examples and exercises",
        ],
        scores: [0, 1, 1, 2],
    },
    {
        question: "How comfortable are you with TypeScript / JavaScript?",
        options: [
            "Never used it",
            "Know JavaScript, learning TypeScript",
            "Comfortable with TypeScript",
            "Advanced TypeScript user",
        ],
        scores: [0, 1, 2, 3],
    },
];

interface CourseRecommendation {
    slug: string;
    title: string;
    difficulty: string;
    color: string;
    summary: string;
    emoji: string;
}

const COURSES: CourseRecommendation[] = [
    {
        slug: "solana-fundamentals",
        title: "Solana Fundamentals",
        difficulty: "Beginner",
        color: "from-blue-500/20 to-cyan-500/20 border-blue-500/40",
        summary:
            "Start here. Learn accounts, programs, transactions, and the Solana execution model with practical @solana/web3.js exercises.",
        emoji: "🌱",
    },
    {
        slug: "anchor-development",
        title: "Anchor Program Development",
        difficulty: "Intermediate",
        color: "from-purple-500/20 to-pink-500/20 border-purple-500/40",
        summary:
            "Build real on-chain programs with Anchor's Rust framework — IDL generation, PDAs, account validation, and testing.",
        emoji: "⚓",
    },
    {
        slug: "token-extensions",
        title: "Token Extensions (Token-2022)",
        difficulty: "Advanced",
        color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/40",
        summary:
            "Master the Token-2022 standard — transfer hooks, confidential transfers, non-transferable tokens, and token-gated apps.",
        emoji: "🪩",
    },
];

function getRecommendation(answers: Record<number, number>): CourseRecommendation {
    let total = 0;
    for (const [qIdx, optIdx] of Object.entries(answers)) {
        total += QUESTIONS[Number(qIdx)].scores[optIdx] ?? 0;
    }
    const max = QUESTIONS.reduce((s, q) => s + Math.max(...q.scores), 0);
    const ratio = total / max;

    if (ratio < 0.33) return COURSES[0]; // Fundamentals
    if (ratio < 0.67) return COURSES[1]; // Anchor
    return COURSES[2];                   // Token Extensions
}

export function AssessmentSection() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);

    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

    const totalSteps = QUESTIONS.length;
    const question = QUESTIONS[currentStep];
    const progress = showResults ? 100 : ((currentStep + 1) / totalSteps) * 100;
    const recommendation = showResults ? getRecommendation(answers) : null;

    function selectOption(optionIndex: number) {
        setAnswers((prev) => ({ ...prev, [currentStep]: optionIndex }));
    }

    function handleNext() {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            setShowResults(true);
        }
    }

    function handleReset() {
        setCurrentStep(0);
        setAnswers({});
        setShowResults(false);
    }

    return (
        <section className="w-full bg-background py-20">
            <div className="mx-auto max-w-2xl px-4 sm:px-6">
                <motion.div
                    ref={sectionRef}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <p className="mb-2 font-game text-lg tracking-widest text-yellow-400 uppercase">
                        Assessment
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-game">
                        Find the right course for yourself
                    </h2>
                    <p className="mt-3 font-game text-lg sm:text-xl text-muted-foreground">
                        {showResults
                            ? "Based on your answers, here's where you should start"
                            : `Answer ${totalSteps} questions to find which course to start with`}
                    </p>
                </motion.div>

                {/* Progress bar */}
                <div className="mt-10 h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                        className="h-full rounded-full bg-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {!showResults ? (
                        /* ─── QUIZ ─── */
                        <motion.div
                            key={`q-${currentStep}`}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.25 }}
                            className="mt-10"
                        >
                            <p className="mb-6 font-game text-xl sm:text-2xl">
                                <span className="mr-2 text-yellow-400">{currentStep + 1}.</span>
                                {question.question}
                            </p>

                            <div className="flex flex-col gap-3">
                                {question.options.map((option, i) => {
                                    const isSelected = answers[currentStep] === i;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => selectOption(i)}
                                            className={cn(
                                                "rounded-xl border-2 px-5 py-4 text-left font-game text-lg sm:text-xl transition-all",
                                                isSelected
                                                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                                                    : "border-border hover:border-yellow-400/40 hover:bg-accent"
                                            )}
                                        >
                                            <span className="mr-3 opacity-50">
                                                {String.fromCharCode(65 + i)}.
                                            </span>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Navigation */}
                            <div className="mt-8 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    disabled={currentStep === 0}
                                    onClick={() => setCurrentStep((s) => s - 1)}
                                    className="font-game text-xl"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back
                                </Button>
                                <span className="font-game text-muted-foreground text-sm">
                                    {currentStep + 1} / {totalSteps}
                                </span>
                                <Button
                                    variant="pixel"
                                    size="lg"
                                    disabled={answers[currentStep] === undefined}
                                    onClick={handleNext}
                                    className="font-game text-xl"
                                >
                                    {currentStep === totalSteps - 1 ? "See Results" : "Next"}
                                    <ArrowRight className="size-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        /* ─── RESULTS ─── */
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="mt-10"
                        >
                            {/* Trophy header */}
                            <div className="flex flex-col items-center gap-3 mb-8 text-center">
                                <div className="text-6xl">{recommendation!.emoji}</div>
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400/15 border border-yellow-400/30 px-4 py-1 font-game text-yellow-400 text-sm mb-3">
                                        <Trophy className="h-3.5 w-3.5" />
                                        Recommended for you
                                    </div>
                                    <h3 className="font-game text-2xl sm:text-3xl">
                                        {recommendation!.title}
                                    </h3>
                                </div>
                            </div>

                            {/* Course card */}
                            <div
                                className={cn(
                                    "rounded-2xl border-2 bg-gradient-to-br p-6 space-y-4",
                                    recommendation!.color
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-game text-muted-foreground text-sm">
                                        {recommendation!.difficulty} level
                                    </span>
                                </div>
                                <p className="font-game text-base sm:text-lg text-foreground/90 leading-relaxed">
                                    {recommendation!.summary}
                                </p>

                                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                    <Button
                                        asChild
                                        variant="pixel"
                                        size="lg"
                                        className="font-game text-lg flex-1"
                                    >
                                        <Link href={`/courses/${recommendation!.slug}`}>
                                            Start Course
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="lg"
                                        className="font-game text-lg flex-1"
                                    >
                                        <Link href="/courses">Browse All Courses</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Retake */}
                            <div className="mt-5 text-center">
                                <button
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 font-game text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    Retake assessment
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
