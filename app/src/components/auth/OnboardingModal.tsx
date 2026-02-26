"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, GraduationCap, Code2, Rocket } from "lucide-react";
import { Link } from "@/i18n/routing";

interface Question {
    id: string;
    text: string;
    field: string;
    options: { label: string; value: number }[];
}

const ASSESSMENT_QUESTIONS: Question[] = [
    {
        id: "rust",
        text: "How familiar are you with Rust programming?",
        field: "rust",
        options: [
            { label: "Never used it", value: 1 },
            { label: "Basic syntax known", value: 2 },
            { label: "Built small projects", value: 3 },
            { label: "Commercial experience", value: 4 },
        ]
    },
    {
        id: "solana",
        text: "How much experience do you have with Solana development?",
        field: "solana",
        options: [
            { label: "New to Solana", value: 1 },
            { label: "Know the concepts (PDAs, Accounts)", value: 2 },
            { label: "Have deployed to Devnet", value: 3 },
            { label: "Have deployed Mainnet programs", value: 4 },
        ]
    },
    {
        id: "web3",
        text: "How familiar are you with Web3 concepts (Wallets, Signature, DeFi)?",
        field: "web3",
        options: [
            { label: "Brand new", value: 1 },
            { label: "Average crypto user", value: 2 },
            { label: "Intermediate developer", value: 3 },
            { label: "Advanced expert", value: 4 },
        ]
    }
];

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0); // 0: Welcome, 1: Quiz, 2: Result
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});

    useEffect(() => {
        const isComplete = localStorage.getItem("onboarding_complete");
        if (!isComplete) {
            setIsOpen(true);
        }
    }, []);

    const handleNext = () => {
        if (step === 0) setStep(1);
        else if (step === 1) {
            if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
                setCurrentQuestion(prev => prev + 1);
            } else {
                setStep(2);
            }
        }
    };

    const handleAnswer = (value: number) => {
        const q = ASSESSMENT_QUESTIONS[currentQuestion];
        setAnswers(prev => ({ ...prev, [q.field]: value }));
        handleNext();
    };

    const finishOnboarding = () => {
        localStorage.setItem("onboarding_complete", "true");
        setIsOpen(false);
    };

    const getRecommendation = () => {
        const total = Object.values(answers).reduce((a, b) => a + b, 0);
        if (total < 6) return { title: "Solana Fundamentals", slug: "solana-fundamentals", desc: "Start with the basics of Solana architecture." };
        if (total < 10) return { title: "Building with Anchor", slug: "building-with-anchor", desc: "Dive into program development using the Anchor framework." };
        return { title: "Advanced Solana Security", slug: "solana-security", desc: "Master industrial-grade program security." };
    };

    const recommendation = getRecommendation();

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) finishOnboarding(); }}>
            <DialogContent className="sm:max-w-[500px] bg-void border-white/5 p-0 overflow-hidden">
                <div className="p-8">
                    {step === 0 && (
                        <div className="space-y-6 text-center py-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-solana/10 flex items-center justify-center border border-solana/20">
                                <GraduationCap className="w-8 h-8 text-solana" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-display font-bold text-white text-center">Welcome to Academy</DialogTitle>
                            </DialogHeader>
                            <p className="text-text-secondary leading-relaxed">
                                Take a quick skill assessment to personalize your learning journey and get course recommendations.
                            </p>
                            <Button onClick={handleNext} className="w-full bg-solana text-black font-bold hover:bg-solana/90">
                                Start Assessment
                                <ChevronRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-8 py-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono text-text-muted uppercase tracking-wider">
                                    <span>Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}</span>
                                    <span>{Math.round(((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100)}%</span>
                                </div>
                                <Progress value={((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100} className="h-1 bg-white/5" />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-white">
                                    {ASSESSMENT_QUESTIONS[currentQuestion].text}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {ASSESSMENT_QUESTIONS[currentQuestion].options.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleAnswer(opt.value)}
                                            className="group p-4 bg-white/5 border border-white/5 rounded-xl text-left hover:border-solana/50 hover:bg-solana/5 transition-all duration-200"
                                        >
                                            <span className="text-sm font-medium text-white group-hover:text-solana transition-colors">
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 py-4 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-display font-bold text-white">Profile Complete!</h3>
                                <p className="text-text-secondary text-sm">Based on your skills, we recommend this starting point:</p>
                            </div>

                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-solana/20 flex items-center justify-center">
                                        <Rocket className="w-5 h-5 text-solana" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{recommendation.title}</h4>
                                        <p className="text-[10px] text-text-muted">{recommendation.desc}</p>
                                    </div>
                                </div>
                                <Link href={`/courses/${recommendation.slug}`} onClick={finishOnboarding}>
                                    <Button className="w-full mt-2 bg-white text-black font-bold hover:bg-white/90">
                                        Go to Course
                                    </Button>
                                </Link>
                            </div>

                            <button
                                onClick={finishOnboarding}
                                className="text-xs text-text-muted hover:text-white transition-colors"
                            >
                                Skip to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
