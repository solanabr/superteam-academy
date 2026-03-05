"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const trackMap: Record<string, string> = {
  beginner: "solana-fundamentals",
  intermediate: "anchor-development",
  advanced: "defi-development",
  expert: "advanced-solana",
  expert_defi: "defi-development",
};

interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

export function OnboardingQuiz({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("onboarding");

  const questions: QuizQuestion[] = [
    {
      id: "logic",
      question: t("q1"),
      options: [
        { label: t("q1o1"), value: "analytical" },
        { label: t("q1o2"), value: "social" },
        { label: t("q1o3"), value: "visual" },
        { label: t("q1o4"), value: "kinesthetic" },
      ],
    },
    {
      id: "risk",
      question: t("q2"),
      options: [
        { label: t("q2o1"), value: "safe" },
        { label: t("q2o2"), value: "risky" },
        { label: t("q2o3"), value: "balanced" },
        { label: t("q2o4"), value: "patient" },
      ],
    },
    {
      id: "experience",
      question: t("q3"),
      options: [
        { label: t("q3o1"), value: "beginner" },
        { label: t("q3o2"), value: "intermediate" },
        { label: t("q3o3"), value: "advanced" },
        { label: t("q3o4"), value: "expert" },
      ],
    },
    {
      id: "goal",
      question: t("q4"),
      options: [
        { label: t("q4o1"), value: "defi" },
        { label: t("q4o2"), value: "nft" },
        { label: t("q4o3"), value: "frontend" },
        { label: t("q4o4"), value: "explore" },
      ],
    },
  ];

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
        <h2 className="text-2xl font-bold">{t("matchFound")}</h2>
        <p className="text-muted-foreground">{t("takingYou")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4 max-w-xl mx-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="outline">{t("questionOf", { current: step + 1, total: questions.length })}</Badge>
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
        {step < questions.length - 1 ? t("next") : t("findPath")}
      </Button>
    </div>
  );
}