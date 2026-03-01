"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Code,
  Layers,
  Rocket,
  Sparkles,
  Star,
} from "lucide-react";

interface Recommendation {
  title: string;
  slug: string;
  difficulty: string;
  trackName: string;
  totalXP: number;
  badge: string;
}

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
      { label: "interestDefi", value: "defi", icon: Layers },
      { label: "interestNft", value: "nft", icon: Sparkles },
      { label: "interestWeb3", value: "web3", icon: Code },
      { label: "interestPrograms", value: "programs", icon: Rocket },
    ],
  },
];

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const { update: updateSession } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const progress = ((step + 1) / (STEPS.length + 1)) * 100;

  async function markOnboardingComplete() {
    await fetch("/api/onboarding/complete", { method: "POST" });
    await updateSession();
  }

  async function fetchRecommendations(allAnswers: string[]) {
    setLoadingRecs(true);
    setShowResults(true);
    try {
      const res = await fetch("/api/onboarding/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceLevel: allAnswers[0] ?? "beginner",
          web3Level: allAnswers[1] ?? "beginner",
          interest: allAnswers[2] ?? "web3",
        }),
      });
      if (res.ok) {
        setRecommendations(await res.json());
      }
    } catch { /* ignore */ }
    await markOnboardingComplete();
    setLoadingRecs(false);
  }

  const handleSelect = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = value;
    setAnswers(newAnswers);

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      fetchRecommendations(newAnswers);
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
          {loadingRecs ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-6">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            recommendations.map((course, i) => (
              <Link key={course.slug} href={`/courses/${course.slug}`}>
                <Card className="transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{course.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {course.trackName && <span>{course.trackName}</span>}
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {course.totalXP} {tc("xp")}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {tc(course.difficulty)}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="secondary">{course.badge}</Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              {tc("dashboard")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/courses">
            <Button size="lg" variant="outline" className="gap-2">
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
                {t(option.label as "optionNone")}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => fetchRecommendations(answers)}>
          {t("skipQuiz")}
        </Button>
      </div>
    </div>
  );
}
