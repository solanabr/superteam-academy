"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Code, Coins, Cpu, Gamepad2, Rocket, Shield, Terminal, Zap } from "lucide-react";

type Question = {
    id: string;
    title: string;
    subtitle: string;
    options: {
        id: string;
        label: string;
        icon: React.ReactNode;
        points: { track: string; value: number }[];
    }[];
};

const questions: Question[] = [
    {
        id: "experience",
        title: "What's your current experience level?",
        subtitle: "We'll tailor your learning path based on your background.",
        options: [
            {
                id: "beginner",
                label: "I'm new to programming",
                icon: <Rocket className="h-6 w-6" />,
                points: [{ track: "solana-core", value: 2 }]
            },
            {
                id: "web2",
                label: "I'm a Web2 developer",
                icon: <Terminal className="h-6 w-6" />,
                points: [{ track: "solana-core", value: 1 }, { track: "defi", value: 1 }]
            },
            {
                id: "web3",
                label: "I build Smart Contracts",
                icon: <Code className="h-6 w-6" />,
                points: [{ track: "defi", value: 2 }, { track: "nfts", value: 1 }]
            }
        ]
    },
    {
        id: "interest",
        title: "What are you most interested in?",
        subtitle: "Choose the area of Solana that excites you the most.",
        options: [
            {
                id: "defi",
                label: "DeFi & Finance",
                icon: <Coins className="h-6 w-6" />,
                points: [{ track: "defi", value: 3 }]
            },
            {
                id: "nfts",
                label: "NFTs & Gaming",
                icon: <Gamepad2 className="h-6 w-6" />,
                points: [{ track: "nfts", value: 3 }]
            },
            {
                id: "infra",
                label: "Core Infrastructure",
                icon: <Cpu className="h-6 w-6" />,
                points: [{ track: "solana-core", value: 3 }]
            }
        ]
    },
    {
        id: "goal",
        title: "What is your main goal?",
        subtitle: "How can Superteam Academy help you?",
        options: [
            {
                id: "learn",
                label: "Just exploring",
                icon: <Zap className="h-6 w-6" />,
                points: [{ track: "solana-core", value: 1 }]
            },
            {
                id: "build",
                label: "Build a startup",
                icon: <Rocket className="h-6 w-6" />,
                points: [{ track: "defi", value: 2 }]
            },
            {
                id: "bounties",
                label: "Earn bounties",
                icon: <Shield className="h-6 w-6" />,
                points: [{ track: "nfts", value: 2 }, { track: "defi", value: 1 }]
            }
        ]
    }
];

export function OnboardingQuiz() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinishing, setIsFinishing] = useState(false);
    const router = useRouter();

    const handleSelect = (optionId: string) => {
        setAnswers((prev) => ({ ...prev, [questions[currentStep].id]: optionId }));

        if (currentStep < questions.length - 1) {
            setTimeout(() => setCurrentStep((prev) => prev + 1), 300);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setIsFinishing(true);
        // In a real app, calculate the best track based on answers, award XP, and save to profile
        setTimeout(() => {
            // Use URL parameter to trigger a success toast or visually notify the user
            router.push("/dashboard?onboarding=success");
        }, 2000);
    };

    const progress = ((currentStep) / questions.length) * 100;

    if (isFinishing) {
        return (
            <Card className="w-full max-w-lg border-primary/20 bg-card/50 backdrop-blur-sm p-8 text-center brutalist-card mx-auto">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center space-y-4"
                >
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 shadow-[0_0_15px_rgba(0,255,148,0.3)]">
                        <Zap className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold font-syne text-foreground">Analyzing Your Profile...</h2>
                    <p className="text-muted-foreground font-space">We are tailoring the best Solana learning track for you.</p>
                    <div className="w-full max-w-xs mt-6 mx-auto">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.8 }}
                            />
                        </div>
                    </div>
                </motion.div>
            </Card>
        );
    }

    const question = questions[currentStep];

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="mb-8 space-y-2">
                <div className="flex justify-between text-sm font-space text-muted-foreground">
                    <span>Step {currentStep + 1} of {questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-secondary/50" />
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="border-border bg-card/10 backdrop-blur-md brutalist-card">
                        <CardHeader>
                            <CardTitle className="font-syne text-2xl md:text-3xl text-foreground text-center">
                                {question.title}
                            </CardTitle>
                            <p className="text-center text-muted-foreground font-space mt-2">
                                {question.subtitle}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {question.options.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    className={`w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 text-left group
                    ${answers[question.id] === option.id
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                                        }`}
                                >
                                    <div className={`flex flex-shrink-0 items-center justify-center h-12 w-12 rounded-lg mr-4 transition-colors
                    ${answers[question.id] === option.id ? "bg-primary text-background" : "bg-secondary text-foreground group-hover:bg-primary/20 group-hover:text-primary"}`}>
                                        {option.icon}
                                    </div>
                                    <span className="font-space font-medium text-lg leading-snug">{option.label}</span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
