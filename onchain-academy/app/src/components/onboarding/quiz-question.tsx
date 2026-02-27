"use client";

import React from "react";
import { motion } from "framer-motion";
import type { QuizQuestion as QuizQuestionType } from "@/lib/data/quiz-questions";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  onAnswer: (questionId: string, optionId: string) => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  onAnswer,
}: QuizQuestionProps) {
  const handleSelect = (optionId: string) => {
    if (selectedOptionId) return; // Already answered
    onAnswer(question.id, optionId);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Question number */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: 3,
          textTransform: "uppercase" as const,
          color: "var(--c-text-dim)",
          marginBottom: 24,
        }}
      >
        {String(questionNumber).padStart(2, "0")} / {String(totalQuestions).padStart(2, "0")}
      </motion.p>

      {/* Category badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase" as const,
          color: "var(--xp)",
          padding: "4px 12px",
          border: "1px solid rgba(20, 241, 149, 0.2)",
          marginBottom: 20,
        }}
      >
        {question.category.replace("-", " ")}
      </motion.div>

      {/* Question text */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 400,
          color: "var(--foreground)",
          textAlign: "center",
          lineHeight: 1.3,
          margin: "0 0 36px",
          maxWidth: 560,
        }}
      >
        {question.question}
      </motion.h2>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 520,
        }}
      >
        {question.options.map((option, i) => {
          const isSelected = selectedOptionId === option.id;
          const isLocked = selectedOptionId !== null;

          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.15 + i * 0.06,
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => handleSelect(option.id)}
              disabled={isLocked}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: isSelected
                  ? "rgba(20, 241, 149, 0.06)"
                  : "transparent",
                border: isSelected
                  ? "1px solid rgba(20, 241, 149, 0.3)"
                  : "1px solid var(--overlay-divider)",
                cursor: isLocked ? "default" : "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: isLocked && !isSelected ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (isLocked) return;
                const el = e.currentTarget;
                el.style.borderColor = "rgba(20, 241, 149, 0.2)";
                el.style.background = "rgba(20, 241, 149, 0.03)";
              }}
              onMouseLeave={(e) => {
                if (isLocked) return;
                const el = e.currentTarget;
                el.style.borderColor = "var(--overlay-divider)";
                el.style.background = "transparent";
              }}
            >
              {/* Letter indicator */}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: isSelected
                    ? "var(--xp)"
                    : "var(--c-text-dim)",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: isSelected
                    ? "1px solid rgba(20, 241, 149, 0.4)"
                    : "1px solid var(--overlay-divider)",
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}
              >
                {OPTION_LETTERS[i]}
              </span>

              {/* Option text */}
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  color: isSelected
                    ? "var(--foreground)"
                    : "var(--c-text-2)",
                  lineHeight: 1.5,
                  transition: "color 0.3s",
                }}
              >
                {option.text}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 20,
                  }}
                  style={{
                    marginLeft: "auto",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--xp)",
                    boxShadow: "0 0 8px rgba(20, 241, 149, 0.4)",
                    flexShrink: 0,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
