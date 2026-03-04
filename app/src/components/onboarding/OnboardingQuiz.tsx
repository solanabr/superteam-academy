"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProgressStore } from "@/stores/progress-store";
import {
  CheckCircle2,
  ChevronRight,
  Zap,
  Code2,
  Coins,
  Image,
  Server,
  Vote,
  Clock,
  Target,
  Briefcase,
  Smile,
  Rocket,
  ArrowLeft,
} from "lucide-react";

export const QUIZ_STORAGE_KEY = "onboarding-quiz-completed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackId =
  | "solana-fundamentals"
  | "defi-development"
  | "nft-gaming"
  | "advanced-protocol";

interface OptionWeight {
  track: TrackId;
  points: number;
}

interface Option {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  weights: OptionWeight[];
}

interface Question {
  id: number;
  questionKey: string;
  options: Option[];
}

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------

const QUESTIONS: Question[] = [
  {
    id: 1,
    questionKey: "q1.question",
    options: [
      {
        id: "beginner",
        labelKey: "q1.beginner",
        icon: Smile,
        weights: [
          { track: "solana-fundamentals", points: 3 },
          { track: "nft-gaming", points: 1 },
        ],
      },
      {
        id: "intermediate",
        labelKey: "q1.intermediate",
        icon: Code2,
        weights: [
          { track: "defi-development", points: 2 },
          { track: "nft-gaming", points: 2 },
          { track: "solana-fundamentals", points: 1 },
        ],
      },
      {
        id: "advanced",
        labelKey: "q1.advanced",
        icon: Briefcase,
        weights: [
          { track: "advanced-protocol", points: 3 },
          { track: "defi-development", points: 2 },
        ],
      },
    ],
  },
  {
    id: 2,
    questionKey: "q2.question",
    options: [
      {
        id: "defi",
        labelKey: "q2.defi",
        icon: Coins,
        weights: [
          { track: "defi-development", points: 3 },
          { track: "solana-fundamentals", points: 1 },
        ],
      },
      {
        id: "nfts",
        labelKey: "q2.nfts",
        icon: Image,
        weights: [
          { track: "nft-gaming", points: 3 },
          { track: "solana-fundamentals", points: 1 },
        ],
      },
      {
        id: "infrastructure",
        labelKey: "q2.infrastructure",
        icon: Server,
        weights: [
          { track: "advanced-protocol", points: 3 },
          { track: "solana-fundamentals", points: 2 },
        ],
      },
      {
        id: "daos",
        labelKey: "q2.daos",
        icon: Vote,
        weights: [
          { track: "defi-development", points: 2 },
          { track: "advanced-protocol", points: 2 },
          { track: "solana-fundamentals", points: 1 },
        ],
      },
    ],
  },
  {
    id: 3,
    questionKey: "q3.question",
    options: [
      {
        id: "1to3",
        labelKey: "q3.light",
        icon: Clock,
        weights: [
          { track: "solana-fundamentals", points: 2 },
          { track: "nft-gaming", points: 1 },
        ],
      },
      {
        id: "3to7",
        labelKey: "q3.moderate",
        icon: Target,
        weights: [
          { track: "defi-development", points: 2 },
          { track: "nft-gaming", points: 2 },
          { track: "solana-fundamentals", points: 1 },
        ],
      },
      {
        id: "7plus",
        labelKey: "q3.intensive",
        icon: Rocket,
        weights: [
          { track: "advanced-protocol", points: 3 },
          { track: "defi-development", points: 2 },
        ],
      },
    ],
  },
  {
    id: 4,
    questionKey: "q4.question",
    options: [
      {
        id: "build-dapp",
        labelKey: "q4.buildDapp",
        icon: Code2,
        weights: [
          { track: "defi-development", points: 2 },
          { track: "nft-gaming", points: 2 },
          { track: "advanced-protocol", points: 1 },
        ],
      },
      {
        id: "get-job",
        labelKey: "q4.getJob",
        icon: Briefcase,
        weights: [
          { track: "solana-fundamentals", points: 2 },
          { track: "advanced-protocol", points: 2 },
          { track: "defi-development", points: 1 },
        ],
      },
      {
        id: "learn-fun",
        labelKey: "q4.learnFun",
        icon: Smile,
        weights: [
          { track: "nft-gaming", points: 2 },
          { track: "solana-fundamentals", points: 2 },
        ],
      },
      {
        id: "start-project",
        labelKey: "q4.startProject",
        icon: Rocket,
        weights: [
          { track: "defi-development", points: 2 },
          { track: "nft-gaming", points: 1 },
          { track: "advanced-protocol", points: 2 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function computeRecommendedTrack(answers: string[]): TrackId {
  const scores: Record<TrackId, number> = {
    "solana-fundamentals": 0,
    "defi-development": 0,
    "nft-gaming": 0,
    "advanced-protocol": 0,
  };

  answers.forEach((answerId, qIndex) => {
    const question = QUESTIONS[qIndex];
    if (!question) return;
    const option = question.options.find((o) => o.id === answerId);
    if (!option) return;
    for (const w of option.weights) {
      scores[w.track] += w.points;
    }
  });

  const entries = Object.entries(scores) as [TrackId, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]![0];
}

// ---------------------------------------------------------------------------
// Track metadata
// ---------------------------------------------------------------------------

const TRACK_GRADIENTS: Record<TrackId, string> = {
  "solana-fundamentals": "from-purple-500/20 to-primary/10",
  "defi-development": "from-green-500/20 to-secondary/10",
  "nft-gaming": "from-pink-500/20 to-accent/10",
  "advanced-protocol": "from-orange-500/20 to-amber-500/10",
};

const TRACK_ICON_COLORS: Record<TrackId, string> = {
  "solana-fundamentals": "text-primary",
  "defi-development": "text-secondary",
  "nft-gaming": "text-pink-400",
  "advanced-protocol": "text-orange-400",
};

const TRACK_ICONS: Record<TrackId, React.ElementType> = {
  "solana-fundamentals": Code2,
  "defi-development": Coins,
  "nft-gaming": Image,
  "advanced-protocol": Server,
};

const TRACK_HREFS: Record<TrackId, string> = {
  "solana-fundamentals": "/courses",
  "defi-development": "/courses",
  "nft-gaming": "/courses",
  "advanced-protocol": "/courses",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  current: number;
  total: number;
  labelKey: string;
}

function ProgressBar({ current, total, labelKey }: ProgressBarProps) {
  const pct = Math.round(((current) / total) * 100);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{labelKey}</span>
        <span>{current}/{total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface OnboardingQuizProps {
  /** Called after quiz completes (XP awarded + localStorage written) */
  onComplete?: (track: TrackId) => void;
}

export function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const t = useTranslations("onboardingQuiz");
  const router = useRouter();
  const addBonusXp = useProgressStore((s) => s.addBonusXp);

  const [step, setStep] = useState<number>(0); // 0-3 = questions, 4 = result
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);
  // recommendedTrack is computed via useMemo below

  // Compute recommendation once all 4 questions answered
  const recommendedTrackMemo = useMemo(() => {
    if (answers.length === QUESTIONS.length) {
      return computeRecommendedTrack(answers);
    }
    return null;
  }, [answers]);

  const currentQuestion = QUESTIONS[step] ?? null;
  const isResultStep = step === QUESTIONS.length;
  const totalSteps = QUESTIONS.length;

  const handleSelect = useCallback((optionId: string) => {
    setSelected(optionId);
  }, []);

  const handleNext = useCallback(() => {
    if (!selected || isResultStep) return;

    const newAnswers = [...answers, selected];
    setAnimDir("forward");
    setVisible(false);

    setTimeout(() => {
      setAnswers(newAnswers);
      setSelected(null);
      setStep((s) => s + 1);
      setVisible(true);
    }, 200);
  }, [selected, answers, isResultStep]);

  const handleBack = useCallback(() => {
    if (step === 0) return;
    setAnimDir("back");
    setVisible(false);
    setTimeout(() => {
      setAnswers((prev) => prev.slice(0, -1));
      setSelected(answers[step - 1] ?? null); // restore previous selection
      setStep((s) => s - 1);
      setVisible(true);
    }, 200);
  }, [step, answers]);

  const handleFinish = useCallback(() => {
    if (!recommendedTrackMemo) return;
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ track: recommendedTrackMemo, completedAt: Date.now() }));
    addBonusXp(50, "onboarding-quiz");
    onComplete?.(recommendedTrackMemo);
    router.push(TRACK_HREFS[recommendedTrackMemo] as "/courses");
  }, [recommendedTrackMemo, addBonusXp, onComplete, router]);

  const TrackIcon = recommendedTrackMemo ? TRACK_ICONS[recommendedTrackMemo] : Code2;

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Progress indicator */}
      {!isResultStep && (
        <div className="mb-8">
          <ProgressBar
            current={step + 1}
            total={totalSteps}
            labelKey={t("stepLabel", { current: step + 1, total: totalSteps })}
          />
        </div>
      )}

      {/* Card */}
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-200",
          visible ? "opacity-100 translate-y-0" : animDir === "forward" ? "opacity-0 translate-y-2" : "opacity-0 -translate-y-2"
        )}
        style={{ transform: visible ? "translateY(0)" : undefined }}
      >
        {!isResultStep && currentQuestion ? (
          /* Question step */
          <div>
            <p className="mb-6 text-center text-lg font-semibold">
              {t(currentQuestion.questionKey as Parameters<typeof t>[0])}
            </p>
            <div className={cn(
              "grid gap-3",
              currentQuestion.options.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
              currentQuestion.options.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
              "grid-cols-1 sm:grid-cols-2"
            )}>
              {currentQuestion.options.map((option) => {
                const OptionIcon = option.icon;
                const isSelected = selected === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={cn(
                      "group flex flex-col items-center gap-3 rounded-xl border p-4 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 bg-muted/20"
                    )}
                    aria-pressed={isSelected}
                  >
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <OptionIcon className={cn(
                        "h-6 w-6 transition-colors duration-200",
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )} aria-hidden="true" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium leading-snug transition-colors duration-200",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {t(option.labelKey as Parameters<typeof t>[0])}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={step === 0}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("back")}
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!selected}
                className="gap-1.5"
              >
                {step < QUESTIONS.length - 1 ? t("next") : t("seeResults")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : (
          /* Result step */
          recommendedTrackMemo && (
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                TRACK_GRADIENTS[recommendedTrackMemo]
              )}>
                <TrackIcon className={cn("h-12 w-12", TRACK_ICON_COLORS[recommendedTrackMemo])} aria-hidden="true" />
              </div>

              <p className="mb-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {t("result.recommendedTrack")}
              </p>
              <h2 className="text-2xl font-bold">
                {t(`tracks.${recommendedTrackMemo}.title` as Parameters<typeof t>[0])}
              </h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
                {t(`tracks.${recommendedTrackMemo}.description` as Parameters<typeof t>[0])}
              </p>

              {/* XP award callout */}
              <div className="mt-6 flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2">
                <Zap className="h-4 w-4 text-secondary" aria-hidden="true" />
                <span className="text-sm font-semibold text-secondary">
                  {t("result.xpAward", { xp: 50 })}
                </span>
              </div>

              <Button
                className="mt-8 gap-2 px-8"
                size="lg"
                onClick={handleFinish}
              >
                {t("result.startLearning")}
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-muted-foreground"
                onClick={() => {
                  setStep(0);
                  setAnswers([]);
                  setSelected(null);
                  setVisible(true);
                }}
              >
                {t("result.retake")}
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
