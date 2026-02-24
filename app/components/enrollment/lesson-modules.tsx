"use client";

import { motion, AnimatePresence } from "motion/react";
import BN from "bn.js";
import { isLessonComplete } from "@/lib/bitmap";
import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";

interface LessonModulesProps {
  lessonCount: number;
  lessonFlags: BN[];
  nextLesson: number;
  onLessonClick: (index: number) => void;
  disabled?: boolean;
  xpPerLesson: number;
}

const MODULE_SIZE = 5;

export function LessonModules({
  lessonCount,
  lessonFlags,
  nextLesson,
  onLessonClick,
  disabled,
  xpPerLesson,
}: LessonModulesProps) {
  const t = useTranslations("enrollment");
  const moduleCount = Math.ceil(lessonCount / MODULE_SIZE);
  const activeModule = nextLesson >= 0 ? Math.floor(nextLesson / MODULE_SIZE) : -1;
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(activeModule >= 0 ? [activeModule] : [0]));

  const prevFlagsRef = useRef<BN[]>(lessonFlags);
  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const newlyDone = new Set<number>();
    for (let i = 0; i < lessonCount; i++) {
      const wasDone = isLessonComplete(prevFlagsRef.current, i);
      const isDone = isLessonComplete(lessonFlags, i);
      if (!wasDone && isDone) newlyDone.add(i);
    }
    if (newlyDone.size > 0) {
      setJustCompleted(newlyDone);
      const timer = setTimeout(() => setJustCompleted(new Set()), 1200);
      return () => clearTimeout(timer);
    }
    prevFlagsRef.current = lessonFlags;
  }, [lessonFlags, lessonCount]);

  const toggle = (moduleIdx: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(moduleIdx)) next.delete(moduleIdx);
      else next.add(moduleIdx);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: moduleCount }).map((_, mi) => {
        const start = mi * MODULE_SIZE;
        const end = Math.min(start + MODULE_SIZE, lessonCount);
        const lessons = Array.from({ length: end - start }, (_, i) => start + i);
        const doneInModule = lessons.filter((i) => isLessonComplete(lessonFlags, i)).length;
        const total = lessons.length;
        const isOpen = expanded.has(mi);
        const allDone = doneInModule === total;

        return (
          <div key={mi} className="rounded-xl border border-edge-soft overflow-hidden">
            <button
              onClick={() => toggle(mi)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card/50"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                allDone
                  ? "bg-solana-green/15 text-solana-green"
                  : mi === activeModule
                    ? "bg-solana-purple/15 text-solana-purple"
                    : "bg-card text-content-muted"
              }`}>
                {allDone ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{mi + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content">
                  {t("module")} {mi + 1}
                </p>
                <p className="text-xs text-content-muted">
                  {t("lessonsRange", { start: start + 1, end })} · {doneInModule}/{total} · +{total * xpPerLesson} XP
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:block h-1.5 w-16 rounded-full bg-edge-soft overflow-hidden">
                  <div
                    className="h-full rounded-full bg-solana-green transition-all duration-500"
                    style={{ width: `${(doneInModule / total) * 100}%` }}
                  />
                </div>
                <svg
                  className={`h-4 w-4 text-content-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-5 gap-2 px-4 pb-4 sm:grid-cols-5">
                    {lessons.map((i) => {
                      const completed = isLessonComplete(lessonFlags, i);
                      const isNext = i === nextLesson;
                      const isNew = justCompleted.has(i);

                      return (
                        <motion.button
                          key={i}
                          onClick={() => isNext && !disabled && onLessonClick(i)}
                          disabled={completed || !isNext || disabled}
                          className={`relative flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            completed
                              ? "bg-solana-green/15 text-solana-green border border-solana-green/20"
                              : isNext
                                ? "bg-solana-purple/15 text-solana-purple border border-solana-purple/40 cursor-pointer hover:bg-solana-purple/25"
                                : "bg-card text-content-muted border border-edge-soft"
                          }`}
                          animate={
                            isNew
                              ? { scale: [1, 1.25, 1], backgroundColor: ["rgba(20,241,149,0)", "rgba(20,241,149,0.3)", "rgba(20,241,149,0.15)"] }
                              : isNext
                                ? { borderColor: ["rgba(153,69,255,0.4)", "rgba(153,69,255,0.8)", "rgba(153,69,255,0.4)"] }
                                : {}
                          }
                          transition={
                            isNew
                              ? { duration: 0.5, ease: "easeOut" }
                              : isNext
                                ? { duration: 2, repeat: Infinity }
                                : {}
                          }
                        >
                          <span className="font-mono text-xs">{i + 1}</span>
                          {completed && (
                            <motion.svg
                              className="absolute -right-1 -top-1 h-3.5 w-3.5 text-solana-green"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              initial={isNew ? { scale: 0, rotate: -180 } : false}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </motion.svg>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
