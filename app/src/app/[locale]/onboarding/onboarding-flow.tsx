"use client";

import React, { useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import { quizQuestions } from "@/lib/data/quiz-questions";
import { onboardingService } from "@/lib/services/onboarding-service";
import type { Track, Difficulty, Course } from "@/lib/services/types";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { IntroScreen } from "@/components/onboarding/intro-screen";
import { QuizQuestion } from "@/components/onboarding/quiz-question";
import { QuizProgressBar } from "@/components/onboarding/quiz-progress-bar";
import { QuizResults } from "@/components/onboarding/quiz-results";
import { CourseRecommendations } from "@/components/onboarding/course-recommendations";
import { SiteOverview } from "@/components/onboarding/site-overview";

type Step = "welcome" | "intro" | "quiz" | "results" | "recommendations" | "overview";

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const TRANSITION = {
  x: { type: "spring" as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.25 },
};

const STREAK_COUNT = 100;
const WARP_DURATION = 1400;

function spawnStreaks(container: HTMLDivElement) {
  container.innerHTML = "";
  for (let i = 0; i < STREAK_COUNT; i++) {
    const streak = document.createElement("div");
    const angle = Math.random() * 360;
    const length = 80 + Math.random() * 200;
    const delay = Math.random() * 0.3;
    const duration = 0.6 + Math.random() * 0.5;
    streak.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      width: ${length}px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(20,241,149,${0.3 + Math.random() * 0.5}), rgba(153,69,255,${0.2 + Math.random() * 0.3}), transparent);
      transform-origin: 0% 50%;
      --streak-angle: ${angle}deg;
      opacity: 0;
      animation: onb-streakJump ${duration}s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards;
    `;
    container.appendChild(streak);
  }
}

export function OnboardingFlow() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { publicKey } = useWallet();

  const [step, setStep] = useState<Step>(() =>
    searchParams.get("start") === "1" ? "intro" : "welcome"
  );
  const [jumping, setJumping] = useState(false);
  const [exitWarping, setExitWarping] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  const streakContainerRef = useRef<HTMLDivElement>(null);

  // Results state
  const [score, setScore] = useState(0);
  const [recommendedTrack, setRecommendedTrack] = useState<Track>("rust");
  const [recommendedDifficulty, setRecommendedDifficulty] =
    useState<Difficulty>("beginner");
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);

  const walletAddress = publicKey?.toBase58();

  // Welcome → warp → intro
  const handleStart = useCallback(() => {
    setJumping(true);
    if (streakContainerRef.current) spawnStreaks(streakContainerRef.current);

    setTimeout(() => {
      setDirection(1);
      setStep("intro");
      setJumping(false);
      if (streakContainerRef.current) streakContainerRef.current.innerHTML = "";
    }, WARP_DURATION);
  }, []);

  // Intro → quiz
  const handleIntroComplete = useCallback(() => {
    setDirection(1);
    setStep("quiz");
    setQuestionIndex(0);
    setAnswers({});
  }, []);

  const handleSkip = useCallback(() => {
    const assessment = {
      answers: {},
      score: 0,
      totalQuestions: quizQuestions.length,
      recommendedTrack: "rust" as Track,
      recommendedDifficulty: "beginner" as Difficulty,
      completedAt: new Date().toISOString(),
    };
    onboardingService.saveAssessment(assessment, walletAddress);
    router.push(`/${locale}/dashboard`);
  }, [walletAddress, locale, router]);

  const handleAnswer = useCallback(
    (questionId: string, optionId: string) => {
      const updated = { ...answers, [questionId]: optionId };
      setAnswers(updated);

      setTimeout(() => {
        if (questionIndex < quizQuestions.length - 1) {
          setDirection(1);
          setQuestionIndex((prev) => prev + 1);
        } else {
          const results = onboardingService.calculateResults(updated);
          setScore(results.score);
          setRecommendedTrack(results.recommendedTrack);
          setRecommendedDifficulty(results.recommendedDifficulty);
          setRecommendedCourses(
            onboardingService.getRecommendedCourses(
              results.recommendedTrack,
              results.recommendedDifficulty,
            ),
          );
          setDirection(1);
          setStep("results");
        }
      }, 500);
    },
    [answers, questionIndex],
  );

  // Results → overview (via "Next" button)
  const handleNextFromResults = useCallback(() => {
    setDirection(1);
    setStep("overview");
  }, []);

  const handleViewRecommendations = useCallback(() => {
    setDirection(1);
    setStep("recommendations");
  }, []);

  // Recommendations → overview
  const handleComplete = useCallback(() => {
    setDirection(1);
    setStep("overview");
  }, []);

  const handleBrowseAll = useCallback(() => {
    setDirection(1);
    setStep("overview");
  }, []);

  // Overview done → save + exit warp → dashboard
  const handleFinishOverview = useCallback(() => {
    setExitWarping(true);
    if (streakContainerRef.current) spawnStreaks(streakContainerRef.current);

    const assessment = {
      answers,
      score,
      totalQuestions: quizQuestions.length,
      recommendedTrack,
      recommendedDifficulty,
      completedAt: new Date().toISOString(),
    };
    onboardingService.saveAssessment(assessment, walletAddress);

    setTimeout(() => {
      router.push(`/${locale}/dashboard`);
    }, WARP_DURATION);
  }, [
    answers,
    score,
    recommendedTrack,
    recommendedDifficulty,
    walletAddress,
    locale,
    router,
  ]);

  const stepKey =
    step === "quiz" ? `quiz-${questionIndex}` : step;

  const isFullViewport = step === "welcome";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        perspective:
          isFullViewport || jumping || exitWarping ? "2000px" : undefined,
      }}
    >
      {/* Top-left corner bracket */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          width: 20,
          height: 20,
          borderTop: "1px solid var(--overlay-border)",
          borderLeft: "1px solid var(--overlay-border)",
          zIndex: 1,
        }}
      />
      {/* Bottom-right corner bracket */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 20,
          height: 20,
          borderBottom: "1px solid var(--overlay-border)",
          borderRight: "1px solid var(--overlay-border)",
          zIndex: 1,
        }}
      />

      {/* Quiz progress bar */}
      {step === "quiz" && (
        <div
          style={{
            position: "absolute",
            top: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
          }}
        >
          <QuizProgressBar
            current={questionIndex}
            total={quizQuestions.length}
          />
        </div>
      )}

      {/* Warp streak layer */}
      <div
        ref={streakContainerRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 500,
        }}
      />

      {/* Welcome screen — full viewport with warp out */}
      {step === "welcome" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transition: jumping
              ? "all 1.2s cubic-bezier(0.7, 0, 0.1, 1)"
              : "none",
            transform: jumping
              ? "translateZ(1200px) rotateX(-15deg) rotateY(5deg)"
              : "translateZ(0)",
            opacity: jumping ? 0 : 1,
            filter: jumping ? "blur(40px) brightness(2)" : "none",
          }}
        >
          <WelcomeScreen onStart={handleStart} onSkip={handleSkip} />
        </div>
      )}

      {/* Intro / Quiz / Results / Recommendations */}
      {step !== "welcome" && (
        <div
          style={{
            width: "100%",
            maxWidth: 680,
            padding: "0 24px",
            position: "relative",
            minHeight: 400,
            transformStyle: exitWarping ? "preserve-3d" : undefined,
            transition: exitWarping
              ? "all 1.2s cubic-bezier(0.7, 0, 0.1, 1)"
              : "none",
            transform: exitWarping
              ? "translateZ(1200px) rotateX(-15deg) rotateY(5deg)"
              : "translateZ(0)",
            opacity: exitWarping ? 0 : 1,
            filter: exitWarping ? "blur(40px) brightness(2)" : "none",
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              style={{ width: "100%" }}
            >
              {step === "intro" && (
                <IntroScreen
                  onContinue={handleIntroComplete}
                  onSkip={handleSkip}
                />
              )}

              {step === "quiz" && (
                <QuizQuestion
                  question={quizQuestions[questionIndex]}
                  questionNumber={questionIndex + 1}
                  totalQuestions={quizQuestions.length}
                  selectedOptionId={
                    answers[quizQuestions[questionIndex].id] ?? null
                  }
                  onAnswer={handleAnswer}
                />
              )}

              {step === "results" && (
                <QuizResults
                  score={score}
                  totalQuestions={quizQuestions.length}
                  recommendedTrack={recommendedTrack}
                  recommendedDifficulty={recommendedDifficulty}
                  onViewRecommendations={handleViewRecommendations}
                  onNext={handleNextFromResults}
                />
              )}

              {step === "recommendations" && (
                <CourseRecommendations
                  courses={recommendedCourses}
                  track={recommendedTrack}
                  difficulty={recommendedDifficulty}
                  onComplete={handleComplete}
                  onBrowseAll={handleBrowseAll}
                />
              )}

              {step === "overview" && (
                <SiteOverview onFinish={handleFinishOverview} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Bottom status */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 1,
            background: "var(--xp)",
            boxShadow: "0 0 6px rgba(20,241,149,0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            color: "var(--c-text-dim)",
          }}
        >
          {step === "welcome"
            ? t("statusSkillAssessment")
            : step === "intro"
              ? t("statusCalibration")
              : step === "quiz"
                ? t("statusQuestionOf", { current: questionIndex + 1, total: quizQuestions.length })
                : step === "results"
                  ? t("statusAssessmentComplete")
                  : step === "overview"
                    ? t("statusQuickOrientation")
                    : t("statusRecommendedPath")}
        </span>
      </div>

    </div>
  );
}
