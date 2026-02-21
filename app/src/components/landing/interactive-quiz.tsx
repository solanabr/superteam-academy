"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { AnimatedSection } from "./animated-section";

const QUESTION_COUNT = 4;

export function InteractiveQuiz() {
  const t = useTranslations("landing.quiz");
  const prefersReducedMotion = useReducedMotion();

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const correctIndex = Number(t(`questions.${current}.correct`));
  const options = [0, 1, 2, 3];

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    if (current + 1 >= QUESTION_COUNT) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswered(false);
    setFinished(false);
  }

  const transitionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.3 },
      };

  return (
    <AnimatedSection>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("sectionSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            {/* Progress bar */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((finished ? QUESTION_COUNT : current) / QUESTION_COUNT) * 100}%`,
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-sm text-muted-foreground tabular-nums">
                {Math.min(current + 1, QUESTION_COUNT)}/{QUESTION_COUNT}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {finished ? (
                <motion.div
                  key="result"
                  {...transitionProps}
                  className="text-center py-8"
                >
                  <div className="animate-celebration-bounce inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-6">
                    <Trophy className="h-10 w-10 text-brazil-gold" />
                  </div>
                  <h3 className="text-2xl font-bold">{t("resultTitle")}</h3>
                  <p className="mt-2 text-lg text-muted-foreground">
                    {t("resultScore", { score, total: QUESTION_COUNT })}
                  </p>
                  <p className="mt-1 text-sm text-primary font-medium">
                    +{score * 25} XP
                  </p>
                  <button
                    onClick={handleRestart}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-muted"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("tryAgain")}
                  </button>
                </motion.div>
              ) : (
                <motion.div key={current} {...transitionProps}>
                  <h3 className="text-lg font-semibold">
                    {t(`questions.${current}.question`)}
                  </h3>

                  <div className="mt-6 space-y-3">
                    {options.map((i) => {
                      const isCorrect = i === correctIndex;
                      const isSelected = i === selected;
                      let borderClass = "border-border hover:border-primary/40";
                      if (answered) {
                        if (isCorrect)
                          borderClass = "border-st-green bg-st-green/5";
                        else if (isSelected)
                          borderClass = "border-destructive bg-destructive/5";
                        else borderClass = "border-border opacity-50";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelect(i)}
                          disabled={answered}
                          className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all duration-200 ${borderClass} ${!answered ? "cursor-pointer active:scale-[0.98]" : ""}`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">
                            {t(`questions.${current}.options.${i}`)}
                          </span>
                          {answered && isCorrect && (
                            <CheckCircle2 className="h-5 w-5 text-st-green shrink-0" />
                          )}
                          {answered && isSelected && !isCorrect && (
                            <XCircle className="h-5 w-5 text-destructive shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <motion.div
                      initial={
                        prefersReducedMotion ? {} : { opacity: 0, y: 10 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center justify-between"
                    >
                      <p className="text-sm text-muted-foreground">
                        {selected === correctIndex
                          ? t("correctFeedback")
                          : t("incorrectFeedback")}
                      </p>
                      <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
                      >
                        {current + 1 >= QUESTION_COUNT
                          ? t("seeResults")
                          : t("nextQuestion")}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
