// app/src/app/[locale]/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Compass, Cpu, Rocket, Terminal, Zap } from "lucide-react";
import confetti from "canvas-confetti";

// Конфигурация вопросов
const questions = [
  {
    id: "experience",
    title: "How much programming experience do you have?",
    subtitle: "This helps us tailor your learning path.",
    options: [
      { id: "none", label: "None, I'm a complete beginner", icon: <Compass className="h-6 w-6 mb-2" /> },
      { id: "some", label: "I know some JS/Python/etc.", icon: <Code2 className="h-6 w-6 mb-2" /> },
      { id: "pro", label: "I'm an experienced developer", icon: <Terminal className="h-6 w-6 mb-2" /> },
    ]
  },
  {
    id: "solana_knowledge",
    title: "How familiar are you with Solana?",
    subtitle: "Be honest, it's okay to be new!",
    options: [
      { id: "crypto_noob", label: "What is a blockchain?", icon: <div className="text-2xl mb-2">🤔</div> },
      { id: "user", label: "I use phantom & trade tokens", icon: <Zap className="h-6 w-6 mb-2 text-yellow-500" /> },
      { id: "dev", label: "I know accounts, PDAs, CPIs", icon: <Cpu className="h-6 w-6 mb-2 text-purple-500" /> },
    ]
  },
  {
    id: "goal",
    title: "What is your main goal here?",
    subtitle: "We'll get you there faster.",
    options: [
      { id: "job", label: "Get a job in Web3", icon: <div className="text-2xl mb-2">💼</div> },
      { id: "bounty", label: "Win Superteam bounties", icon: <div className="text-2xl mb-2">💰</div> },
      { id: "build", label: "Build my own startup", icon: <Rocket className="h-6 w-6 mb-2 text-red-500" /> },
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { userDb, refetchUser } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);

  const progress = ((currentStep) / questions.length) * 100;

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    // Переходим к следующему шагу через небольшую паузу для плавности
    setTimeout(() => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishOnboarding();
        }
    }, 400);
  };

  const finishOnboarding = async () => {
    if (!userDb?.walletAddress) return;
    setIsFinishing(true);

    try {
        await fetch("/api/user/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                walletAddress: userDb.walletAddress,
                answers: answers
            }),
        });

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        
        // Обновляем данные на клиенте
        await refetchUser();

        // Небольшая задержка перед редиректом, чтобы насладиться конфетти
        setTimeout(() => {
            // Анализируем ответы и решаем, куда кинуть.
            // Для демо - всегда на базовый курс
            router.push("/courses/solana-mock-test");
        }, 1500);

    } catch (e) {
        console.error("Onboarding failed", e);
        setIsFinishing(false);
    }
  };

  // Если юзер уже прошел онбординг (случайно зашел по прямой ссылке), уводим его
  if (userDb?.hasCompletedOnboarding) {
      router.replace("/dashboard");
      return null;
  }

  const question = questions[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
        {/* Header Progress */}
        <div className="w-full h-2 bg-muted fixed top-0 left-0 z-50">
            <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full">
            <AnimatePresence mode="wait">
                {!isFinishing ? (
                    <motion.div
                        key={currentStep}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full space-y-8 text-center"
                    >
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{question.title}</h1>
                            <p className="text-xl text-muted-foreground">{question.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                            {question.options.map((option) => (
                                <Card 
                                    key={option.id} 
                                    className={`cursor-pointer transition-all hover:border-primary hover:shadow-lg hover:-translate-y-1 ${answers[question.id] === option.id ? 'border-primary ring-2 ring-primary bg-primary/5' : ''}`}
                                    onClick={() => handleSelect(question.id, option.id)}
                                >
                                    <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
                                        {option.icon}
                                        <h3 className="font-semibold mt-2">{option.label}</h3>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="finishing"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="inline-flex h-24 w-24 rounded-full bg-green-500/20 text-green-500 items-center justify-center mb-4">
                            <Rocket className="h-12 w-12 animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-bold">Personalizing your path...</h2>
                        <p className="text-muted-foreground text-lg">We are setting up your learning environment.</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
}