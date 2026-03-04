"use client";

import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { MeshGradient } from "@/components/MeshGradient";
import { GridPattern } from "@/components/GridPattern";
import { ArrowRight, CheckCircle2, Trophy, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
    {
        id: 1,
        question: "How long have you been developing with Rust or C++?",
        options: [
            { id: "a", text: "New to systems programming", level: "Beginner" },
            { id: "b", text: "1-2 years experience", level: "Intermediate" },
            { id: "c", text: "3+ years / Advanced systems dev", level: "Advanced" },
        ],
    },
    {
        id: 2,
        question: "What is your familiarity with the Solana Programming Model?",
        options: [
            { id: "a", text: "Just starting to learn", level: "Beginner" },
            { id: "b", text: "Built simple programs (e.g. Hello World)", level: "Beginner" },
            { id: "c", text: "Comfortable with PDAs and CPIs", level: "Intermediate" },
            { id: "d", text: "Mastered Anchor and Security patterns", level: "Advanced" },
        ],
    },
    {
        id: 3,
        question: "Do you have experience with Frontend Wallet Integration?",
        options: [
            { id: "a", text: "No experience", level: "Beginner" },
            { id: "b", text: "Have connected Phantom/Solflare before", level: "Intermediate" },
            { id: "c", text: "Advanced (Transaction building/signing)", level: "Advanced" },
        ],
    },
];

export function OnboardingQuiz({ onComplete }: { onComplete: (level: string) => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isFinished, setIsFinished] = useState(false);

    const handleSelect = (level: string) => {
        const newAnswers = [...answers, level];
        setAnswers(newAnswers);

        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    const calculateResult = (finalAnswers: string[]) => {
        // Basic logic: return the highest level chosen by the user
        const levelCounts: Record<string, number> = {
            Beginner: 0,
            Intermediate: 0,
            Advanced: 0,
        };

        finalAnswers.forEach((l) => (levelCounts[l] += 1));

        let finalLevel = "Beginner";
        if (levelCounts.Advanced > 0) finalLevel = "Advanced";
        else if (levelCounts.Intermediate > 1) finalLevel = "Intermediate";

        setIsFinished(true);
        setTimeout(() => onComplete(finalLevel), 2500);
    };

    return (
        <div className="min-h-screen bg-black text-white relative flex items-center justify-center p-6 overflow-hidden">
            <MeshGradient />
            <GridPattern />

            <AnimatePresence mode="wait">
                {!isFinished ? (
                    <motion.div
                        key="quiz"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-xl w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 relative z-10"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Brain className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold italic tracking-tight">Onboarding Quiz</h2>
                                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">
                                    Step {currentStep + 1} of {QUESTIONS.length}
                                </p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-medium mb-8 leading-tight">
                            {QUESTIONS[currentStep].question}
                        </h3>

                        <div className="space-y-4">
                            {QUESTIONS[currentStep].options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.level)}
                                    className="w-full group relative flex items-center justify-between p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-left overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <span className="text-white/80 group-hover:text-white transition-colors">
                                            {option.text}
                                        </span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/80 group-hover:translate-x-1 transition-all" />

                                    {/* Glass highlight effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000" />
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center relative z-10"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200 }}
                            className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 border border-green-500/30"
                        >
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </motion.div>
                        <h2 className="text-4xl font-bold mb-2 tracking-tight">Assessment Complete!</h2>
                        <p className="text-white/60 mb-8 max-w-sm mx-auto">
                            We've tailored your learning path based on your experience. Redirecting you to your personalized courses...
                        </p>
                        <div className="flex items-center justify-center gap-2 text-yellow-500">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">Curating your experience</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
