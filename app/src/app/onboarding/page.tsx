"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, Code2, BookOpen, Shield } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const SKILL_QUESTIONS = [
  {
    id: "q1",
    question: "What's your experience with blockchain development?",
    options: [
      { value: "none", label: "No experience", xp: 0 },
      { value: "some", label: "Built on Ethereum or another chain", xp: 50 },
      { value: "solana", label: "Built something on Solana", xp: 100 },
      { value: "pro", label: "Shipped production dApps", xp: 150 },
    ],
  },
  {
    id: "q2",
    question: "How comfortable are you with Rust?",
    options: [
      { value: "none", label: "Never used Rust", xp: 0 },
      { value: "basic", label: "Read Rust, wrote a few lines", xp: 25 },
      { value: "intermediate", label: "Comfortable with basics", xp: 75 },
      { value: "advanced", label: "Production Rust experience", xp: 125 },
    ],
  },
  {
    id: "q3",
    question: "What's your primary goal?",
    options: [
      { value: "learn", label: "Learn Solana from scratch", xp: 0 },
      { value: "build", label: "Build my first dApp", xp: 50 },
      { value: "career", label: "Land a Web3 job", xp: 75 },
      { value: "scale", label: "Scale existing Solana knowledge", xp: 100 },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const currentQuestion = SKILL_QUESTIONS[step];
  const totalSteps = SKILL_QUESTIONS.length;
  const isLastStep = step === totalSteps - 1;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    if (isLastStep) {
      setCompleted(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const totalBonusXp = Object.values(answers).reduce((sum, val) => {
    const q = SKILL_QUESTIONS.find((qq) => qq.options.some((o) => o.value === val));
    const opt = q?.options.find((o) => o.value === val);
    return sum + (opt?.xp ?? 0);
  }, 0);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("academy_onboarding_done", "true");
    }
    router.push("/courses");
  };

  return (
    <PageLayout showFooter={false}>
      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9945FF]/30 bg-[#9945FF]/10 text-xs font-semibold text-[#9945FF] mb-6">
              <Zap className="h-3 w-3" />
              Skill Assessment
            </div>

            <AnimatePresence mode="wait">
              {!completed ? (
                <motion.div
                  key={`q-${step}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    Question {step + 1} of {totalSteps}
                  </p>
                  <h1 className="text-2xl font-bold mb-6">{currentQuestion.question}</h1>

                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                          answers[currentQuestion.id] === opt.value
                            ? "bg-[#9945FF]/15 border-[#9945FF]/40 text-foreground"
                            : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
                        )}
                      >
                        <span className="font-medium">{opt.label}</span>
                        {opt.xp > 0 && (
                          <span className="text-xs font-bold text-[#14F195]">+{opt.xp} XP bonus</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button
                      variant="ghost"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      disabled={step === 0}
                      className="gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="flex gap-1">
                      {SKILL_QUESTIONS.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            i < step ? "bg-[#14F195]" : i === step ? "bg-[#9945FF]" : "bg-white/20"
                          )}
                        />
                      ))}
                    </div>
                    <div className="w-16" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bento-card p-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Based on your answers, we recommend starting with Solana Fundamentals.
                  </p>
                  {totalBonusXp > 0 && (
                    <div className="xp-pill inline-flex mb-6">
                      <Zap className="h-3.5 w-3.5" />
                      +{totalBonusXp} XP welcome bonus
                    </div>
                  )}
                  <Button variant="gradient" size="lg" onClick={handleFinish} className="gap-2">
                    Browse Courses
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    You can always change your preferences in Settings.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            <Link href="/courses" className="hover:text-foreground underline">
              Skip onboarding
            </Link>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
