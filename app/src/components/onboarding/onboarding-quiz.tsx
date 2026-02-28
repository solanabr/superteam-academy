"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Globe,
  Code,
  Rocket,
  Anchor,
  Shield,
  TrendingUp,
  Layout,
  Coins,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Timer,
  Coffee,
  Zap,
  CalendarDays,
} from "lucide-react";
import type { Course } from "@/types";
import { QuizProgress } from "./quiz-progress";
import { QuizStep } from "./quiz-step";
import type { QuizOption } from "./quiz-step";
import { QuizResults } from "./quiz-results";
import type { QuizAnswers } from "./quiz-results";

interface OnboardingQuizProps {
  courses: Course[];
}

const STEP_KEYS = ["experience", "interests", "goal", "pace"] as const;

function buildExperienceOptions(t: (key: string) => string): QuizOption[] {
  return [
    { id: "beginner", label: t("experience.beginner.label"), description: t("experience.beginner.description"), icon: Baby },
    { id: "web-dev", label: t("experience.webDev.label"), description: t("experience.webDev.description"), icon: Globe },
    { id: "dev-new-solana", label: t("experience.devNewSolana.label"), description: t("experience.devNewSolana.description"), icon: Code },
    { id: "solana-dev", label: t("experience.solanaDev.label"), description: t("experience.solanaDev.description"), icon: Rocket },
  ];
}

function buildInterestOptions(t: (key: string) => string): QuizOption[] {
  return [
    { id: "rust", label: t("interests.rust.label"), description: t("interests.rust.description"), icon: Code },
    { id: "anchor", label: t("interests.anchor.label"), description: t("interests.anchor.description"), icon: Anchor },
    { id: "defi", label: t("interests.defi.label"), description: t("interests.defi.description"), icon: TrendingUp },
    { id: "frontend", label: t("interests.frontend.label"), description: t("interests.frontend.description"), icon: Layout },
    { id: "security", label: t("interests.security.label"), description: t("interests.security.description"), icon: Shield },
    { id: "token", label: t("interests.token.label"), description: t("interests.token.description"), icon: Coins },
  ];
}

function buildGoalOptions(t: (key: string) => string): QuizOption[] {
  return [
    { id: "first-program", label: t("goal.firstProgram.label"), description: t("goal.firstProgram.description"), icon: Rocket },
    { id: "job", label: t("goal.job.label"), description: t("goal.job.description"), icon: Briefcase },
    { id: "project", label: t("goal.project.label"), description: t("goal.project.description"), icon: GraduationCap },
    { id: "fun", label: t("goal.fun.label"), description: t("goal.fun.description"), icon: Heart },
    { id: "contribute", label: t("goal.contribute.label"), description: t("goal.contribute.description"), icon: Users },
  ];
}

function buildPaceOptions(t: (key: string) => string): QuizOption[] {
  return [
    { id: "casual", label: t("pace.casual.label"), description: t("pace.casual.description"), icon: Coffee },
    { id: "consistent", label: t("pace.consistent.label"), description: t("pace.consistent.description"), icon: Timer },
    { id: "intensive", label: t("pace.intensive.label"), description: t("pace.intensive.description"), icon: Zap },
    { id: "weekend", label: t("pace.weekend.label"), description: t("pace.weekend.description"), icon: CalendarDays },
  ];
}

export function OnboardingQuiz({ courses }: OnboardingQuizProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    experience: "",
    interests: [],
    goal: "",
    pace: "",
  });

  const showResults = step === STEP_KEYS.length;

  const stepLabels = STEP_KEYS.map((key) => t(`steps.${key}`));

  const handleSingleSelect = useCallback(
    (key: "experience" | "goal" | "pace", id: string) => {
      setAnswers((prev) => ({ ...prev, [key]: id }));
    },
    []
  );

  const handleMultiSelect = useCallback((id: string) => {
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  }, []);

  const canProceed =
    step === 0
      ? answers.experience !== ""
      : step === 1
        ? answers.interests.length > 0
        : step === 2
          ? answers.goal !== ""
          : step === 3
            ? answers.pace !== ""
            : false;

  const handleNext = () => {
    if (canProceed && step < STEP_KEYS.length) {
      // Save answers to localStorage for future reference
      if (step === STEP_KEYS.length - 1) {
        try {
          localStorage.setItem("sta-onboarding", JSON.stringify(answers));
        } catch {
          // Silently ignore storage errors
        }
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const experienceOptions = buildExperienceOptions((key) => t(`questions.${key}`));
  const interestOptions = buildInterestOptions((key) => t(`questions.${key}`));
  const goalOptions = buildGoalOptions((key) => t(`questions.${key}`));
  const paceOptions = buildPaceOptions((key) => t(`questions.${key}`));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Progress */}
      {!showResults && (
        <div className="mb-10">
          <QuizProgress
            currentStep={step}
            totalSteps={STEP_KEYS.length}
            labels={stepLabels}
          />
        </div>
      )}

      {/* Quiz Steps */}
      {step === 0 && (
        <QuizStep
          title={t("questions.experience.title")}
          subtitle={t("questions.experience.subtitle")}
          options={experienceOptions}
          selected={answers.experience ? [answers.experience] : []}
          onSelect={(id) => handleSingleSelect("experience", id)}
        />
      )}

      {step === 1 && (
        <QuizStep
          title={t("questions.interests.title")}
          subtitle={t("questions.interests.subtitle")}
          options={interestOptions}
          selected={answers.interests}
          multiSelect
          onSelect={handleMultiSelect}
        />
      )}

      {step === 2 && (
        <QuizStep
          title={t("questions.goal.title")}
          subtitle={t("questions.goal.subtitle")}
          options={goalOptions}
          selected={answers.goal ? [answers.goal] : []}
          onSelect={(id) => handleSingleSelect("goal", id)}
        />
      )}

      {step === 3 && (
        <QuizStep
          title={t("questions.pace.title")}
          subtitle={t("questions.pace.subtitle")}
          options={paceOptions}
          selected={answers.pace ? [answers.pace] : []}
          onSelect={(id) => handleSingleSelect("pace", id)}
        />
      )}

      {showResults && <QuizResults answers={answers} courses={courses} />}

      {/* Navigation buttons */}
      {!showResults && (
        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            {step === STEP_KEYS.length - 1 ? t("seeResults") : tc("next")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
