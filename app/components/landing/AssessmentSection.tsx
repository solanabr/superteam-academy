"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Question {
    question: string;
    options: string[];
}

const QUESTIONS: Question[] = [
    {
        question: "How comfortable are you with Rust?",
        options: [
            "Never used Rust",
            "Know basics (syntax, ownership)",
            "Comfortable writing programs",
            "Confident with advanced Rust concepts",
        ],
    },
    {
        question: "What's your experience with blockchain development?",
        options: [
            "Complete beginner",
            "Understand basic concepts (wallets, transactions)",
            "Built on other chains (Ethereum, etc.)",
            "Have Solana development experience",
        ],
    },
    {
        question: "What do you want to build on Solana?",
        options: [
            "DeFi protocols",
            "NFT / digital collectible platforms",
            "DAOs & governance tools",
            "Infrastructure & developer tools",
        ],
    },
    {
        question: "How do you prefer to learn?",
        options: [
            "Step-by-step tutorials",
            "Project-based learning",
            "Reading documentation",
            "Code examples and exercises",
        ],
    },
    {
        question: "How comfortable are you with TypeScript?",
        options: [
            "Never used it",
            "Know JavaScript, learning TypeScript",
            "Comfortable with TypeScript",
            "Advanced TypeScript user",
        ],
    },
];

export function AssessmentSection() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});

    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

    const totalSteps = QUESTIONS.length;
    const question = QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / totalSteps) * 100;

    function selectOption(optionIndex: number) {
        setAnswers((prev) => ({ ...prev, [currentStep]: optionIndex }));
    }

    return (
        <section className="w-full bg-zinc-900 py-20">
            <div className="mx-auto max-w-2xl px-6">
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
                    <h2 className="text-4xl font-game">
                        Find the right course for yourself
                    </h2>
                    <p className="mt-3 font-game text-xl text-gray-400">
                        Answer {totalSteps} questions to figure out which course to start
                        with
                    </p>
                </motion.div>

                {/* Progress bar */}
                <div className="mt-10 h-3 overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                        className="h-full rounded-full bg-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>

                {/* Question */}
                <div className="mt-10">
                    <p className="mb-6 font-game text-2xl">
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
                                    className={`rounded-xl border-2 px-5 py-4 text-left font-game text-xl transition-all ${isSelected
                                        ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                                        : "border-zinc-700 hover:border-yellow-400/40 hover:bg-zinc-800"
                                        }`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
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
                    <Button
                        variant="pixel"
                        size="lg"
                        disabled={answers[currentStep] === undefined}
                        onClick={() => {
                            if (currentStep < totalSteps - 1) {
                                setCurrentStep((s) => s + 1);
                            }
                        }}
                        className="font-game text-xl"
                    >
                        {currentStep === totalSteps - 1 ? "See Results" : "Next"}
                        <ArrowRight className="size-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
