"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLocale } from "@/providers/locale-provider";
import { trackEvent } from "@/lib/analytics";
import {
  getOnboardingStorageKey,
  ONBOARDING_EVENT_RETAKE,
} from "@/lib/onboarding";

type SkillTrack = "Rust" | "Anchor" | "DeFi" | "Security" | "Frontend";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

type Option = {
  label: string;
  weight: number;
  track: SkillTrack;
};

type Question = {
  id: string;
  prompt: string;
  options: Option[];
};

type AssessmentSnapshot = {
  answers: number[];
  score: number;
  level: SkillLevel;
  track: SkillTrack;
  createdAt: string;
};

const QUESTIONS: Question[] = [
  {
    id: "experience",
    prompt: "How much coding experience do you have?",
    options: [
      { label: "Just getting started", weight: 1, track: "Frontend" },
      { label: "Built a few projects", weight: 2, track: "Rust" },
      {
        label: "Comfortable shipping production apps",
        weight: 3,
        track: "Anchor",
      },
    ],
  },
  {
    id: "solana",
    prompt: "How familiar are you with Solana accounts and PDAs?",
    options: [
      { label: "I need fundamentals", weight: 1, track: "Rust" },
      { label: "I can read account structures", weight: 2, track: "Anchor" },
      {
        label: "I design account models confidently",
        weight: 3,
        track: "Security",
      },
    ],
  },
  {
    id: "rust",
    prompt: "What is your confidence with Rust?",
    options: [
      { label: "Beginner", weight: 1, track: "Rust" },
      { label: "Intermediate", weight: 2, track: "Rust" },
      { label: "Advanced", weight: 3, track: "Security" },
    ],
  },
  {
    id: "interest",
    prompt: "Which area do you want to master first?",
    options: [
      { label: "On-chain programs with Anchor", weight: 3, track: "Anchor" },
      { label: "DeFi protocols and integrations", weight: 3, track: "DeFi" },
      { label: "Wallet UX and frontend flows", weight: 2, track: "Frontend" },
    ],
  },
  {
    id: "testing",
    prompt: "How do you usually validate your code?",
    options: [
      { label: "Mostly manual testing", weight: 1, track: "Frontend" },
      {
        label: "Unit/integration tests when possible",
        weight: 2,
        track: "Anchor",
      },
      {
        label: "Tests + threat modeling + checks",
        weight: 3,
        track: "Security",
      },
    ],
  },
  {
    id: "goal",
    prompt: "What is your near-term goal?",
    options: [
      { label: "Ship my first Solana dApp", weight: 1, track: "Frontend" },
      {
        label: "Build robust protocol features",
        weight: 2,
        track: "Anchor",
      },
      {
        label: "Contribute at protocol/security level",
        weight: 3,
        track: "Security",
      },
    ],
  },
];

function scoreToLevel(score: number): SkillLevel {
  if (score <= 8) return "Beginner";
  if (score <= 14) return "Intermediate";
  return "Advanced";
}

function getTopTrack(answers: number[]): SkillTrack {
  const tally: Record<SkillTrack, number> = {
    Rust: 0,
    Anchor: 0,
    DeFi: 0,
    Security: 0,
    Frontend: 0,
  };

  answers.forEach((optionIndex, index) => {
    const option = QUESTIONS[index]?.options[optionIndex];
    if (!option) return;
    tally[option.track] += option.weight;
  });

  return (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Rust") as SkillTrack;
}

function getNextStep(track: SkillTrack): string {
  const trackStepMap: Record<SkillTrack, string> = {
    Rust: "Start with Rust + account model lessons, then move to Anchor PDAs.",
    Anchor:
      "Prioritize program architecture, constraints, and instruction design.",
    DeFi: "Focus on composability, token flows, and protocol integrations.",
    Security:
      "Lean into threat modeling, invariant checks, and exploit-resistant patterns.",
    Frontend: "Practice wallet UX, transaction states, and resilient flows.",
  };
  return trackStepMap[track];
}

export function OnboardingGate(): React.JSX.Element | null {
  const { t } = useLocale();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<AssessmentSnapshot | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setActive(false);
      setReady(true);
      setCurrent(0);
      setAnswers([]);
      setResult(null);
      return;
    }

    const storageKey = getOnboardingStorageKey(walletAddress);
    const raw = window.localStorage.getItem(storageKey);

    setReady(true);
    try {
      if (raw) {
        JSON.parse(raw);
        setActive(false);
        return;
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }

    setActive(true);
    setCurrent(0);
    setAnswers([]);
    setResult(null);
    trackEvent("onboarding_assessment_started", { walletAddress });
  }, [walletAddress]);

  useEffect(() => {
    function handleRetake(event: Event): void {
      if (!(event instanceof CustomEvent)) return;
      const detail = event.detail as { walletAddress?: string } | undefined;
      if (!walletAddress || detail?.walletAddress !== walletAddress) {
        return;
      }

      setCurrent(0);
      setAnswers([]);
      setResult(null);
      setActive(true);
      trackEvent("onboarding_assessment_started", {
        walletAddress,
        source: "profile_retake",
      });
    }

    window.addEventListener(
      ONBOARDING_EVENT_RETAKE,
      handleRetake as EventListener,
    );
    return () => {
      window.removeEventListener(
        ONBOARDING_EVENT_RETAKE,
        handleRetake as EventListener,
      );
    };
  }, [walletAddress]);

  const progress = useMemo(
    () => Math.round((current / QUESTIONS.length) * 100),
    [current],
  );

  function handleAnswer(optionIndex: number): void {
    if (!walletAddress) return;

    const nextAnswers = [...answers, optionIndex];
    setAnswers(nextAnswers);
    trackEvent("onboarding_assessment_answered", {
      questionIndex: current,
      optionIndex,
      walletAddress,
    });

    if (current < QUESTIONS.length - 1) {
      setCurrent((value) => value + 1);
      return;
    }

    const score = nextAnswers.reduce((acc, selectedIndex, questionIndex) => {
      const option = QUESTIONS[questionIndex]?.options[selectedIndex];
      return acc + (option?.weight ?? 0);
    }, 0);
    const level = scoreToLevel(score);
    const track = getTopTrack(nextAnswers);

    const snapshot: AssessmentSnapshot = {
      answers: nextAnswers,
      score,
      level,
      track,
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      getOnboardingStorageKey(walletAddress),
      JSON.stringify(snapshot),
    );
    setResult(snapshot);
    trackEvent("onboarding_assessment_completed", {
      score,
      level,
      track,
      walletAddress,
    });
  }

  function finishOnboarding(): void {
    setActive(false);
  }

  if (!ready || !active) {
    return null;
  }

  const question: Question = QUESTIONS[current] ?? {
    id: "fallback",
    prompt: "Choose your current level",
    options: [],
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-3xl"
        >
          {!result ? (
            <Card className="border-primary/25 bg-background/95 shadow-2xl">
              <CardHeader className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("onboardingPage.badge")}
                </div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {t("onboardingPage.questionCounter")} {current + 1}/
                  {QUESTIONS.length}
                </p>
                <ProgressBar value={progress} />
                <CardTitle className="text-2xl leading-snug">
                  {question.prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAnswer(index)}
                    className="w-full rounded-2xl border border-border/60 bg-background/60 px-4 py-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:bg-primary/10"
                  >
                    {option.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/25 bg-background/95 shadow-2xl">
              <CardHeader>
                <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("onboardingPage.resultBadge")}
                </div>
                <CardTitle className="text-2xl">
                  {t("onboardingPage.resultTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("onboardingPage.scoreLabel")}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-primary">
                      {result.score}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("onboardingPage.levelLabel")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {result.level}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("onboardingPage.trackLabel")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {result.track}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">
                    {t("onboardingPage.nextStepLabel")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getNextStep(result.track)}
                  </p>
                </div>

                <Button
                  onClick={finishOnboarding}
                  className="rounded-full px-6"
                >
                  {t("onboardingPage.continueButton")}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
