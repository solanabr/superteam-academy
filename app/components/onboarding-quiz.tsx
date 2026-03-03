"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const questions = [
  {
    id: "logic",
    question: "How would you find the best Solana tutorial online?",
    options: [
      { label: "Search docs.solana.com directly", value: "analytical" },
      { label: "Ask in Discord/community", value: "social" },
      { label: "Watch YouTube videos", value: "visual" },
      { label: "Try building something and figure it out", value: "kinesthetic" },
    ],
  },
  {
    id: "risk",
    question: "You have 100 XP to spend. What do you pick?",
    options: [
      { label: "Guaranteed Bronze badge", value: "safe" },
      { label: "10% chance at Gold badge", value: "risky" },
      { label: "Split between both", value: "balanced" },
      { label: "Save XP for later", value: "patient" },
    ],
  },
  {
    id: "experience",
    question: "Where are you right now?",
    options: [
      { label: "Never written Rust before", value: "beginner" },
      { label: "Know some Rust basics", value: "intermediate" },
      { label: "Built smart contracts before", value: "advanced" },
      { label: "Solana developer already", value: "expert" },
    ],
  },
  {
    id: "goal",
    question: "What do you want to build?",
    options: [
      { label: "DeFi protocol", value: "defi" },
      { label: "NFT project", value: "nft" },
      { label: "dApp frontend", value: "frontend" },
      { label: "Not sure yet", value: "explore" },
    ],
  },
];

const trackMap: Record<string, string> = {
  beginner: "solana-fundamentals",
  intermediate: "anchor-development",
  advanced: "defi-development",
  expert: "advanced-solana",
  expert_defi: "defi-development",
};

export function OnboardingQuiz({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  const current = questions[step];

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [current.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
      const track = trackMap[newAnswers.experience] || "solana-fundamentals";
      setTimeout(() => {
        if (onComplete) onComplete();
        else router.push("/" + locale + "/courses/" + track);
      }, 1500);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
        <div className="text-5xl">🎯</div>
        <h2 className="text-2xl font-bold">Perfect match found!</h2>
        <p className="text-muted-foreground">Taking you to your personalized learning path...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4 max-w-xl mx-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline">Question {step + 1} of {questions.length}</Badge>
          <span className="text-sm text-muted-foreground">{Math.round((step / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: (step / questions.length * 100) + "%" }} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center">{current.question}</h2>
      <div className="grid grid-cols-1 gap-3 w-full">
        {current.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={"w-full text-left p-4 rounded-xl border-2 transition-all duration-200 " + (selected === opt.value ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50 hover:bg-muted")}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <Button size="lg" onClick={handleNext} disabled={!selected} className="w-full">
        {step < questions.length - 1 ? "Next →" : "Find my path 🚀"}
      </Button>
    </div>
  );
}