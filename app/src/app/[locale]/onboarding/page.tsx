"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Code,
  Layers,
  Rocket,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    options: [
      { label: "optionNone", value: "beginner", icon: BookOpen },
      { label: "optionSome", value: "intermediate", icon: Code },
      { label: "optionExperienced", value: "advanced", icon: Rocket },
    ],
  },
  {
    options: [
      { label: "optionNone", value: "beginner", icon: BookOpen },
      { label: "optionSome", value: "intermediate", icon: Code },
      { label: "optionExperienced", value: "advanced", icon: Rocket },
    ],
  },
  {
    options: [
      { label: "DeFi Protocols", value: "defi", icon: Layers },
      { label: "NFT Projects", value: "nft", icon: Sparkles },
      { label: "dApps & Frontends", value: "web3", icon: Code },
      { label: "On-Chain Programs", value: "programs", icon: Rocket },
    ],
  },
];

const RECOMMENDATIONS: Record<
  string,
  { title: string; slug: string; badge: string }[]
> = {
  beginner: [
    {
      title: "Introduction to Solana",
      slug: "introduction-to-solana",
      badge: "Start Here",
    },
    {
      title: "Web3 Frontend with Solana",
      slug: "web3-frontend",
      badge: "Recommended",
    },
  ],
  intermediate: [
    {
      title: "Anchor Framework Fundamentals",
      slug: "anchor-fundamentals",
      badge: "Recommended",
    },
    {
      title: "NFT Development on Solana",
      slug: "nft-development",
      badge: "Popular",
    },
  ],
  advanced: [
    { title: "DeFi on Solana", slug: "defi-on-solana", badge: "Advanced" },
    {
      title: "Anchor Framework Fundamentals",
      slug: "anchor-fundamentals",
      badge: "Deep Dive",
    },
  ],
};

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const progress = ((step + 1) / (STEPS.length + 1)) * 100;
  const level = answers[0] ?? "beginner";
  const recommendations = RECOMMENDATIONS[level] ?? RECOMMENDATIONS["beginner"];

  const handleSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">{t("recommendedPath")}</h1>
        </div>

        <div className="mt-8 space-y-4">
          {recommendations.map((course, i) => (
            <Link key={course.slug} href={`/courses/${course.slug}`}>
              <Card className="transition-all hover:border-primary/50 hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{course.title}</p>
                  </div>
                  <Badge variant="secondary">{course.badge}</Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/courses">
            <Button size="lg" className="gap-2">
              {tc("viewAll")} {tc("courses")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Progress value={progress} className="mt-8" />

      <div className="mt-8">
        <h2 className="text-center text-lg font-semibold">
          {t(`step${step + 1}` as "step1")}
        </h2>

        <div className="mt-6 space-y-3">
          {STEPS[step].options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <option.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="flex-1 font-medium">
                {typeof option.label === "string" &&
                option.label.startsWith("option")
                  ? t(option.label as "optionNone")
                  : option.label}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => setShowResults(true)}>
          {t("skipQuiz")}
        </Button>
      </div>
    </div>
  );
}
