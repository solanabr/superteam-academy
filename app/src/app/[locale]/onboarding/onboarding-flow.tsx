"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { AnimatePresence, motion } from "framer-motion";
import { quizQuestions } from "@/lib/data/quiz-questions";
import { onboardingService } from "@/lib/services/onboarding-service";
import type { Track, Difficulty, Course } from "@/lib/services/types";
import { WelcomeScreen } from "@/components/onboarding/welcome-screen";
import { QuizQuestion } from "@/components/onboarding/quiz-question";
import { QuizProgressBar } from "@/components/onboarding/quiz-progress-bar";
import { QuizResults } from "@/components/onboarding/quiz-results";
import { CourseRecommendations } from "@/components/onboarding/course-recommendations";

type Step = "welcome" | "quiz" | "results" | "recommendations";

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

export function OnboardingFlow() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { publicKey } = useWallet();

  const [step, setStep] = useState<Step>("welcome");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);

  // Results state
  const [score, setScore] = useState(0);
  const [recommendedTrack, setRecommendedTrack] = useState<Track>("rust");
  const [recommendedDifficulty, setRecommendedDifficulty] =
    useState<Difficulty>("beginner");
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);

  const walletAddress = publicKey?.toBase58();

  const handleStart = useCallback(() => {
    setDirection(1);
    setStep("quiz");
    setQuestionIndex(0);
    setAnswers({});
  }, []);

  const handleSkip = useCallback(() => {
    // Save a default assessment for skip
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

      // Auto-advance after a short delay
      setTimeout(() => {
        if (questionIndex < quizQuestions.length - 1) {
          setDirection(1);
          setQuestionIndex((prev) => prev + 1);
        } else {
          // All questions answered, compute results
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

  const handleViewRecommendations = useCallback(() => {
    setDirection(1);
    setStep("recommendations");
  }, []);

  const handleComplete = useCallback(() => {
    const assessment = {
      answers,
      score,
      totalQuestions: quizQuestions.length,
      recommendedTrack,
      recommendedDifficulty,
      completedAt: new Date().toISOString(),
    };
    onboardingService.saveAssessment(assessment, walletAddress);
    router.push(`/${locale}/dashboard`);
  }, [
    answers,
    score,
    recommendedTrack,
    recommendedDifficulty,
    walletAddress,
    locale,
    router,
  ]);

  const handleBrowseAll = useCallback(() => {
    const assessment = {
      answers,
      score,
      totalQuestions: quizQuestions.length,
      recommendedTrack,
      recommendedDifficulty,
      completedAt: new Date().toISOString(),
    };
    onboardingService.saveAssessment(assessment, walletAddress);
    router.push(`/${locale}/courses`);
  }, [
    answers,
    score,
    recommendedTrack,
    recommendedDifficulty,
    walletAddress,
    locale,
    router,
  ]);

  // Derive a unique key for AnimatePresence
  const stepKey =
    step === "quiz" ? `quiz-${questionIndex}` : step;

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
        }}
      />

      {/* Quiz progress bar - only during quiz */}
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

      {/* Animated step transitions */}
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          padding: "0 24px",
          position: "relative",
          minHeight: 400,
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
            {step === "welcome" && (
              <WelcomeScreen onStart={handleStart} onSkip={handleSkip} />
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
          </motion.div>
        </AnimatePresence>
      </div>

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
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 1,
            background: "var(--v9-sol-green)",
            boxShadow: "0 0 6px rgba(20,241,149,0.5)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: 9,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            color: "var(--c-text-dim)",
          }}
        >
          {step === "welcome"
            ? "SKILL ASSESSMENT"
            : step === "quiz"
              ? `QUESTION ${questionIndex + 1} OF ${quizQuestions.length}`
              : step === "results"
                ? "ASSESSMENT COMPLETE"
                : "RECOMMENDED PATH"}
        </span>
      </div>
    </div>
  );
}
