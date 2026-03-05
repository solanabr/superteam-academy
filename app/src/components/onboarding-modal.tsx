"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useOnboarding } from "@/hooks/use-onboarding";
import type { OnboardingResult } from "@/hooks/use-onboarding";
import {
  Rocket,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Sparkles,
  Code2,
  Coins,
  Layers,
  Camera,
  X,
  HelpCircle,
  Lightbulb,
  MessageCircle,
} from "lucide-react";

// ─── Storage keys (same as settings page) ────────────────────
const PROFILE_AVATAR_KEY = "st-academy:profile-avatar";
const PROFILE_NAME_KEY = "st-academy:profile-name";
const PROFILE_BIO_KEY = "st-academy:profile-bio";

// ─── Quiz Data ───────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  questionKey: string;
  options: { labelKey: string; score: number }[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    questionKey: "q1",
    options: [
      { labelKey: "q1_a", score: 0 },
      { labelKey: "q1_b", score: 1 },
      { labelKey: "q1_c", score: 2 },
      { labelKey: "q1_d", score: 3 },
    ],
  },
  {
    id: "q2",
    questionKey: "q2",
    options: [
      { labelKey: "q2_a", score: 0 },
      { labelKey: "q2_b", score: 1 },
      { labelKey: "q2_c", score: 2 },
      { labelKey: "q2_d", score: 3 },
    ],
  },
  {
    id: "q3",
    questionKey: "q3",
    options: [
      { labelKey: "q3_a", score: 0 },
      { labelKey: "q3_b", score: 1 },
      { labelKey: "q3_c", score: 2 },
      { labelKey: "q3_d", score: 3 },
    ],
  },
  {
    id: "q4",
    questionKey: "q4",
    options: [
      { labelKey: "q4_a", score: 0 },
      { labelKey: "q4_b", score: 1 },
      { labelKey: "q4_c", score: 2 },
      { labelKey: "q4_d", score: 3 },
    ],
  },
  {
    id: "q5",
    questionKey: "q5",
    options: [
      { labelKey: "q5_a", score: 0 },
      { labelKey: "q5_b", score: 1 },
      { labelKey: "q5_c", score: 2 },
      { labelKey: "q5_d", score: 3 },
    ],
  },
  {
    id: "q6",
    questionKey: "q6",
    options: [
      { labelKey: "q6_a", score: 0 },
      { labelKey: "q6_b", score: 1 },
      { labelKey: "q6_c", score: 2 },
      { labelKey: "q6_d", score: 3 },
    ],
  },
];

const MAX_SCORE = QUIZ_QUESTIONS.length * 3;

function computeResult(answers: Record<string, number>): OnboardingResult {
  const score = Object.values(answers).reduce((sum, s) => sum + s, 0);
  const pct = score / MAX_SCORE;

  let level: OnboardingResult["level"];
  let recommendedTrack: string;

  if (pct < 0.35) {
    level = "beginner";
    recommendedTrack = "Solana Fundamentals";
  } else if (pct < 0.7) {
    level = "intermediate";
    recommendedTrack = "DeFi";
  } else {
    level = "advanced";
    recommendedTrack = "Full Stack";
  }

  return {
    level,
    score,
    totalQuestions: QUIZ_QUESTIONS.length,
    recommendedTrack,
    completedAt: new Date().toISOString(),
  };
}

// ─── Steps ───────────────────────────────────────────────────

type Step = "profile" | "quiz" | "result";
const TOTAL_STEPS = 1 + QUIZ_QUESTIONS.length + 1; // profile + questions + result

const LEVEL_CONFIG = {
  beginner: {
    icon: Rocket,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    trackIcon: Layers,
  },
  intermediate: {
    icon: Code2,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    trackIcon: Coins,
  },
  advanced: {
    icon: Trophy,
    color: "text-[hsl(var(--brand-logo-green))]",
    bg: "bg-[hsl(var(--brand-logo-green))]/10",
    trackIcon: Sparkles,
  },
} as const;

// ─── Component ───────────────────────────────────────────────

export function OnboardingModal() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const router = useRouter();
  const { connected, publicKey } = useAuth();
  const { needsOnboarding, completeOnboarding } = useOnboarding();

  const [step, setStep] = React.useState<Step>("profile");
  const [currentQ, setCurrentQ] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [result, setResult] = React.useState<OnboardingResult | null>(null);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(
    null,
  );

  // Profile fields
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Don't render if not needed
  if (!connected || !needsOnboarding) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    // Save to localStorage (same keys as settings page)
    if (name.trim()) {
      localStorage.setItem(PROFILE_NAME_KEY, name.trim());
      window.dispatchEvent(new CustomEvent("profile-name-change"));
    }
    if (bio.trim()) {
      localStorage.setItem(PROFILE_BIO_KEY, bio.trim());
      window.dispatchEvent(new CustomEvent("profile-bio-change"));
    }
    if (avatarPreview) {
      localStorage.setItem(PROFILE_AVATAR_KEY, avatarPreview);
      window.dispatchEvent(
        new CustomEvent("profile-avatar-change", { detail: avatarPreview }),
      );
    }
    setStep("quiz");
  };

  const handleSelectOption = (idx: number) => setSelectedOption(idx);

  const handleNextQuestion = () => {
    if (selectedOption === null) return;
    const q = QUIZ_QUESTIONS[currentQ];
    const newAnswers = { ...answers, [q.id]: q.options[selectedOption].score };
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const res = computeResult(newAnswers);
      setResult(res);
      completeOnboarding(res);
      setStep("result");
    }
  };

  const handlePrevQuestion = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      const prevQ = QUIZ_QUESTIONS[currentQ - 1];
      setSelectedOption(
        prevQ.options.findIndex((o) => o.score === answers[prevQ.id]) ?? null,
      );
    } else {
      setStep("profile");
    }
  };

  const handleSkip = () => {
    const defaultResult: OnboardingResult = {
      level: "beginner",
      score: 0,
      totalQuestions: QUIZ_QUESTIONS.length,
      recommendedTrack: "Solana Fundamentals",
      completedAt: new Date().toISOString(),
    };
    completeOnboarding(defaultResult);
  };

  const handleClose = () => {
    if (step === "result") {
      // Already completed, just close
    } else {
      handleSkip();
    }
  };

  // Progress calc
  let progressStep = 0;
  if (step === "profile") progressStep = 0;
  else if (step === "quiz") progressStep = 1 + currentQ;
  else progressStep = TOTAL_STEPS;
  const progressPct = Math.round((progressStep / TOTAL_STEPS) * 100);

  const walletShort = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[hsl(var(--brand-logo-green))]/30 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close / Skip button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={t("skipOnboarding")}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progressPct} className="h-1.5" />
        </div>

        <div className="p-6 sm:p-8">
          {/* ─── Profile Step ─── */}
          {step === "profile" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--brand-logo-green))]/10">
                  <GraduationCap className="h-7 w-7 text-[hsl(var(--brand-logo-green))]" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("welcomeTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("profileSetupDesc")}
                </p>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-[hsl(var(--brand-logo-green))]"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {name.trim()
                        ? name.trim().charAt(0).toUpperCase()
                        : walletShort.charAt(0)}
                    </span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {tSettings("profileName")}
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={walletShort}
                  className="bg-background"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  {tSettings("bio")}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder")}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 gap-2 bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))]"
                >
                  {t("continueToQuiz")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <button
                type="button"
                onClick={handleSkip}
                className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("skipOnboarding")}
              </button>
            </div>
          )}

          {/* ─── Quiz Step ─── */}
          {step === "quiz" && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("questionLabel")} {currentQ + 1}/{QUIZ_QUESTIONS.length}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-foreground">
                  {t(QUIZ_QUESTIONS[currentQ].questionKey)}
                </h2>
              </div>
              <div className="space-y-2">
                {QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-left text-sm transition-all ${
                      selectedOption === idx
                        ? "border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-green))]/5 text-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                        selectedOption === idx
                          ? "border-[hsl(var(--brand-logo-green))] bg-[hsl(var(--brand-logo-green))] text-white"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{t(opt.labelKey)}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevQuestion}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {tCommon("previous")}
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedOption === null}
                  size="sm"
                  className="gap-1 bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))]"
                >
                  {currentQ === QUIZ_QUESTIONS.length - 1
                    ? tCommon("complete")
                    : tCommon("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── Result Step ─── */}
          {step === "result" &&
            result &&
            (() => {
              const cfg = LEVEL_CONFIG[result.level];
              const LevelIcon = cfg.icon;
              const TrackIcon = cfg.trackIcon;
              return (
                <div className="flex flex-col items-center gap-5 text-center">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${cfg.bg}`}
                  >
                    <LevelIcon className={`h-8 w-8 ${cfg.color}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      {t("resultTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("resultDescription")}
                    </p>
                  </div>

                  <div className="w-full rounded-xl border-2 border-[hsl(var(--brand-logo-green))]/30 bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("yourLevel")}
                    </p>
                    <p className={`mt-1 text-xl font-bold ${cfg.color}`}>
                      {t(`level_${result.level}`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("score")}: {result.score}/{MAX_SCORE}
                    </p>
                  </div>

                  <div className="w-full rounded-xl border bg-muted/50 p-4 text-left">
                    <div className="flex items-center gap-2">
                      <TrackIcon className={`h-5 w-5 ${cfg.color}`} />
                      <p className="text-sm font-medium text-foreground">
                        {t("recommendedTrack")}
                      </p>
                    </div>
                    <p className="mt-1 text-base font-bold text-foreground">
                      {result.recommendedTrack}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`track_${result.level}_desc`)}
                    </p>
                  </div>

                  <div className="flex w-full gap-2">
                    <Button
                      onClick={() => router.push("/courses")}
                      className="flex-1 gap-2 bg-[hsl(var(--brand-logo-green))] text-white hover:bg-[hsl(var(--brand-logo-green-hover))]"
                    >
                      {tCommon("exploreCourses")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
        </div>
      </div>
    </div>
  );
}
