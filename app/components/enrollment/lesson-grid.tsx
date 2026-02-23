"use client";

import { motion } from "motion/react";
import BN from "bn.js";
import { isLessonComplete } from "@/lib/bitmap";
import { useRef, useEffect, useState } from "react";

interface LessonGridProps {
  lessonCount: number;
  lessonFlags: BN[];
  nextLesson: number;
  onLessonClick: (index: number) => void;
  disabled?: boolean;
}

export function LessonGrid({
  lessonCount,
  lessonFlags,
  nextLesson,
  onLessonClick,
  disabled,
}: LessonGridProps) {
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

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
      {Array.from({ length: lessonCount }).map((_, i) => {
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
                  ? "bg-solana-purple/15 text-solana-purple border border-solana-purple/40 cursor-pointer hover:bg-solana-purple/25 hover:border-solana-purple/60"
                  : "bg-card text-content-muted border border-edge-soft"
            }`}
            animate={
              isNew
                ? {
                    scale: [1, 1.25, 1],
                    backgroundColor: [
                      "rgba(20,241,149,0)",
                      "rgba(20,241,149,0.3)",
                      "rgba(20,241,149,0.15)",
                    ],
                  }
                : isNext
                  ? {
                      borderColor: [
                        "rgba(153,69,255,0.4)",
                        "rgba(153,69,255,0.8)",
                        "rgba(153,69,255,0.4)",
                      ],
                    }
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
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </motion.svg>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
