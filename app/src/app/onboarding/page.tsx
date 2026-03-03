"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Code, Database, Palette, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const QUESTIONS = [
    {
        id: "experience",
        title: "q_experience_title",
        options: [
            { id: "new", label: "opt_new", icon: <span>👶</span> },
            { id: "web2", label: "opt_web2", icon: <span>💻</span> },
            { id: "solana", label: "opt_solana", icon: <span>⚡</span> },
        ],
    },
    {
        id: "goal",
        title: "q_goal_title",
        options: [
            { id: "smart-contracts", label: "opt_smart_contracts", icon: <Database className="w-5 h-5" /> },
            { id: "frontend", label: "opt_frontend", icon: <Palette className="w-5 h-5" /> },
            { id: "fullstack", label: "opt_fullstack", icon: <Code className="w-5 h-5" /> },
        ],
    },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const t = useTranslations("onboarding");

    const answerCount = Object.keys(answers).length;
    const progress = (answerCount / QUESTIONS.length) * 100;

    const handleSelect = (questionId: string, optionId: string) => {
        setAnswers({ ...answers, [questionId]: optionId });
        setTimeout(() => {
            if (step < QUESTIONS.length) {
                setStep(step + 1);
            }
        }, 300);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary)/0.1)] rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -z-10" />

            <div className="max-w-xl w-full">
                {/* Progress bar */}
                <div className="mb-12">
                    <div className="flex justify-between text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">
                        <span>{t("step")} {Math.min(step + 1, QUESTIONS.length)} {t("of")} {QUESTIONS.length}</span>
                        <span>{Math.round(progress)}% {t("completed")}</span>
                    </div>
                    <div className="h-2 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[hsl(var(--primary))] to-green-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                <div className="glass rounded-3xl p-8 sm:p-12 min-h-[400px] flex flex-col justify-center relative shadow-2xl">
                    <AnimatePresence mode="wait">
                        {step < QUESTIONS.length ? (
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-8 text-center leading-tight">
                                    {t(QUESTIONS[step].title)}
                                </h1>

                                <div className="space-y-4">
                                    {QUESTIONS[step].options.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleSelect(QUESTIONS[step].id, opt.id)}
                                            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                                                answers[QUESTIONS[step].id] === opt.id
                                                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] scale-[0.98]"
                                                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)] hover:bg-[hsl(var(--card))]"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[hsl(var(--background))] flex items-center justify-center text-xl shadow-sm">
                                                {opt.icon}
                                            </div>
                                            <span className="font-semibold text-lg text-left">{t(opt.label)}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            // Result Screen
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                    🎉
                                </div>
                                <h2 className="font-heading text-3xl font-bold mb-4">{t("path_ready")}</h2>
                                <p className="text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed">
                                    {t("path_desc")}
                                </p>

                                <div className="p-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-transparent border border-[hsl(var(--primary)/0.3)] mb-8 text-left">
                                    <h3 className="font-bold mb-2 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-[hsl(var(--primary))]" /> Recommended Track:
                                    </h3>
                                    <p className="font-heading text-xl text-[hsl(var(--primary))]">
                                        {answers.goal === "smart-contracts" ? "Anchor Core Dev" : answers.goal === "frontend" ? "Solana Web3 Frontend" : "Fullstack Solana DApp"}
                                    </p>
                                </div>

                                <Link
                                    href="/dashboard"
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[hsl(var(--primary))] text-white font-bold text-lg hover:opacity-90 hover:shadow-[var(--glow-purple)] transition-all"
                                >
                                    {t("start_learning")} <ArrowRight className="w-5 h-5" />
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
