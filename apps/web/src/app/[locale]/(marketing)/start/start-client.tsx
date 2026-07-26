"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Briefcase,
  ChartLine,
  Check,
  Code,
  Compass,
  Cube,
  CurrencyDollar,
  GameController,
  ImageSquare,
  Rocket,
  Sparkle,
  Stack,
  Target,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  EXPERIENCE_OPTIONS,
  EXPERIENCE_TO_SEGMENT,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  type ExperienceId,
  type GoalId,
  type InterestId,
} from "@/lib/onboarding/intake";
import {
  setExperience as persistExperience,
  updateSegmentState,
} from "@/lib/onboarding/segment-state";
import type { LearnerSegment } from "@/lib/courses/learner-segment";
import {
  trackOnboardingCompleted,
  trackOnboardingGoalCommitted,
  trackOnboardingRouteAccepted,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
} from "@/lib/analytics/events";

export interface SegmentRoute {
  courseId: string;
  href: string;
}

interface StartIntakeClientProps {
  routes: Record<LearnerSegment, SegmentRoute>;
  dailyGoalOptions: number[];
  browseAllHref: string;
}

const ICONS: Record<string, Icon> = {
  Code,
  Cube,
  Sparkle,
  Briefcase,
  Rocket,
  Compass,
  ChartLine,
  ImageSquare,
  CurrencyDollar,
  GameController,
  Stack,
  Brain,
};

const TOTAL_STEPS = 4;

export function StartIntakeClient({
  routes,
  dailyGoalOptions,
  browseAllHref,
}: StartIntakeClientProps) {
  const t = useTranslations("start");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [experience, setExperience] = useState<ExperienceId | null>(null);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [interests, setInterests] = useState<InterestId[]>([]);
  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new screen's heading on every step change so keyboard and
  // screen-reader users are carried to the new content (headings are tabbable
  // via tabIndex={-1}). Not on first mount — that would steal focus on load.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const segment: LearnerSegment | null = experience
    ? EXPERIENCE_TO_SEGMENT[experience]
    : null;
  const recommendedCourseId = routes[segment ?? 1].courseId;

  function chooseExperience(id: ExperienceId) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackOnboardingStarted();
    }
    persistExperience(id);
    setExperience(id);
    trackOnboardingStepCompleted(1, id);
    setStep(2);
  }

  function chooseGoal(id: GoalId) {
    updateSegmentState({ goal: id });
    setGoal(id);
    trackOnboardingStepCompleted(2, id);
    setStep(3);
  }

  function toggleInterest(id: InterestId) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function continueInterests() {
    updateSegmentState({ interests });
    trackOnboardingStepCompleted(3, interests.length > 0 ? interests : null);
    setStep(4);
  }

  function skipInterests() {
    trackOnboardingStepCompleted(3, null);
    setStep(4);
  }

  function chooseDailyGoal(n: number) {
    updateSegmentState({ dailyGoal: n });
    trackOnboardingGoalCommitted(n);
    trackOnboardingStepCompleted(4, n);
    if (experience && goal && segment) {
      trackOnboardingCompleted({ experience, goal, dailyGoal: n });
      trackOnboardingRouteAccepted(true, recommendedCourseId);
      router.push(routes[segment].href);
    }
  }

  function browseAll() {
    trackOnboardingRouteAccepted(false, recommendedCourseId);
    router.push(browseAllHref);
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 py-8 sm:py-12">
      {/* Progress header */}
      <div className="mb-8 flex items-center gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={back}
            className="hover:text-text-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t("back")}
          >
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
          </button>
        ) : (
          <span className="h-9 w-9 shrink-0" aria-hidden="true" />
        )}
        <div
          className="flex-1"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-label={t("progress", { current: step, total: TOTAL_STEPS })}
        >
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < step ? "bg-primary" : "bg-subtle"
                )}
              />
            ))}
          </div>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-text-3">
          {t("progress", { current: step, total: TOTAL_STEPS })}
        </span>
      </div>

      {/* Screen 1 — experience fork (verifiable history, never self-rating) */}
      {step === 1 && (
        <Screen
          headingRef={headingRef}
          title={t("screen1.title")}
          subtitle={t("screen1.subtitle")}
        >
          <div className="flex flex-col gap-3">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                icon={ICONS[opt.icon]}
                label={t(opt.labelKey)}
                desc={opt.descKey ? t(opt.descKey) : undefined}
                selected={experience === opt.id}
                onClick={() => chooseExperience(opt.id)}
              />
            ))}
          </div>
        </Screen>
      )}

      {/* Screen 2 — goal */}
      {step === 2 && (
        <Screen
          headingRef={headingRef}
          title={t("screen2.title")}
          subtitle={t("screen2.subtitle")}
        >
          <div className="flex flex-col gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <OptionCard
                key={opt.id}
                icon={ICONS[opt.icon]}
                label={t(opt.labelKey)}
                desc={opt.descKey ? t(opt.descKey) : undefined}
                selected={goal === opt.id}
                onClick={() => chooseGoal(opt.id)}
              />
            ))}
          </div>
        </Screen>
      )}

      {/* Screen 3 — optional value-relevance chips (skippable, multi-select) */}
      {step === 3 && (
        <Screen
          headingRef={headingRef}
          title={t("screen3.title")}
          subtitle={t("screen3.subtitle")}
        >
          <div className="flex flex-wrap gap-2.5">
            {INTEREST_OPTIONS.map((opt) => {
              const IconCmp = ICONS[opt.icon];
              const selected = interests.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleInterest(opt.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    selected
                      ? "bg-primary/10 text-text-1 border-primary"
                      : "border-border bg-card text-text-2 hover:border-text-3"
                  )}
                >
                  {IconCmp ? (
                    <IconCmp size={16} weight="bold" aria-hidden="true" />
                  ) : null}
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={skipInterests}
              className="hover:text-text-1 text-sm font-semibold text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("screen3.skip")}
            </button>
            <button
              type="button"
              onClick={continueInterests}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-extrabold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("screen3.continue")}
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </Screen>
      )}

      {/* Screen 4 — daily-goal picker, wired to existing quest targets */}
      {step === 4 && (
        <Screen
          headingRef={headingRef}
          title={t("screen4.title")}
          subtitle={t("screen4.subtitle")}
        >
          <div className="flex flex-col gap-3">
            {dailyGoalOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => chooseDailyGoal(n)}
                className="group flex items-center gap-4 rounded-xl border-[1.5px] border-border bg-card p-4 text-left transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-subtle text-primary">
                  <Target size={22} weight="duotone" aria-hidden="true" />
                </span>
                <span className="text-text-1 flex-1 font-display text-base font-bold">
                  {t("dailyGoal.perDay", { count: n })}
                </span>
                <ArrowRight
                  size={18}
                  weight="bold"
                  aria-hidden="true"
                  className="text-text-3 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={browseAll}
            className="hover:text-text-1 mt-8 inline-flex items-center gap-1.5 self-center text-sm font-medium text-text-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("browseAll")}
            <ArrowRight size={13} weight="bold" aria-hidden="true" />
          </button>
        </Screen>
      )}
    </main>
  );
}

function Screen({
  headingRef,
  title,
  subtitle,
  children,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="start-step-title"
      className="flex flex-1 flex-col"
    >
      <h1
        id="start-step-title"
        ref={headingRef}
        tabIndex={-1}
        className="text-text-1 font-display text-2xl font-extrabold tracking-tight focus-visible:outline-none sm:text-3xl"
      >
        {title}
      </h1>
      <p className="mb-8 mt-2 text-text-2">{subtitle}</p>
      {children}
    </section>
  );
}

function OptionCard({
  icon: IconCmp,
  label,
  desc,
  selected,
  onClick,
}: {
  icon: Icon | undefined;
  label: string;
  desc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group flex items-start gap-4 rounded-xl border-[1.5px] p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected
          ? "bg-primary/10 border-primary"
          : "border-border bg-card hover:border-primary"
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-subtle text-primary">
        {IconCmp ? (
          <IconCmp size={22} weight="duotone" aria-hidden="true" />
        ) : null}
      </span>
      <span className="flex-1">
        <span className="text-text-1 flex items-center gap-2 font-display text-base font-bold">
          {label}
          {selected ? (
            <Check
              size={16}
              weight="bold"
              aria-hidden="true"
              className="text-primary"
            />
          ) : null}
        </span>
        {desc ? (
          <span className="mt-0.5 block text-sm text-text-3">{desc}</span>
        ) : null}
      </span>
    </button>
  );
}
