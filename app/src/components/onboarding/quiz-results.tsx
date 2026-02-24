"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Track, Difficulty } from "@/lib/services/types";
import { TRACK_LABELS, TRACK_COLORS, DIFFICULTY_COLORS } from "@/lib/constants";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  recommendedTrack: Track;
  recommendedDifficulty: Difficulty;
  onViewRecommendations: () => void;
  onNext?: () => void;
}

export function QuizResults({
  score,
  totalQuestions,
  recommendedTrack,
  recommendedDifficulty,
  onViewRecommendations,
  onNext,
}: QuizResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const trackColor = TRACK_COLORS[recommendedTrack];
  const difficultyColor = DIFFICULTY_COLORS[recommendedDifficulty];

  // Animate score count-up
  useEffect(() => {
    if (score === 0) return;
    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (frame >= totalFrames) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [score]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 9,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: "var(--c-text-dim)",
          marginBottom: 24,
        }}
      >
        ASSESSMENT RESULTS
      </motion.p>

      {/* Score ring */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "1px solid var(--overlay-divider)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          marginBottom: 32,
        }}
      >
        {/* Animated arc */}
        <svg
          width={140}
          height={140}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx={70}
            cy={70}
            r={68}
            fill="none"
            stroke="rgba(20, 241, 149, 0.06)"
            strokeWidth={2}
          />
          <motion.circle
            cx={70}
            cy={70}
            r={68}
            fill="none"
            stroke="var(--v9-sol-green)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={Math.PI * 2 * 68}
            initial={{ strokeDashoffset: Math.PI * 2 * 68 }}
            animate={{
              strokeDashoffset:
                Math.PI * 2 * 68 - (score / totalQuestions) * Math.PI * 2 * 68,
            }}
            transition={{
              delay: 0.3,
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </svg>

        {/* Score text */}
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 44,
            fontWeight: 400,
            color: "var(--foreground)",
            lineHeight: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          {animatedScore}
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            color: "var(--c-text-muted)",
            position: "relative",
            zIndex: 1,
          }}
        >
          / {totalQuestions}
        </span>
      </motion.div>

      {/* Score label */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
          color: "var(--c-text-2)",
          marginBottom: 32,
        }}
      >
        You scored{" "}
        <span style={{ color: "var(--v9-sol-green)", fontWeight: 700 }}>
          {score}
        </span>{" "}
        out of {totalQuestions} questions correctly
      </motion.p>

      {/* Recommendation badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Track badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            border: `1px solid ${trackColor}33`,
            background: `${trackColor}0A`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 1,
              background: trackColor,
            }}
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: trackColor,
              letterSpacing: 1,
              textTransform: "uppercase" as const,
            }}
          >
            {TRACK_LABELS[recommendedTrack]} Track
          </span>
        </div>

        {/* Difficulty badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            border: `1px solid ${difficultyColor}33`,
            background: `${difficultyColor}0A`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: difficultyColor,
            }}
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: difficultyColor,
              letterSpacing: 1,
              textTransform: "uppercase" as const,
            }}
          >
            {recommendedDifficulty}
          </span>
        </div>
      </motion.div>

      {/* Explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.4 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          color: "var(--c-text-muted)",
          maxWidth: 380,
          lineHeight: 1.6,
          marginBottom: 36,
        }}
      >
        Based on your answers, we recommend starting with the{" "}
        <span style={{ color: trackColor, fontWeight: 500 }}>
          {TRACK_LABELS[recommendedTrack]}
        </span>{" "}
        track at the{" "}
        <span style={{ color: difficultyColor, fontWeight: 500 }}>
          {recommendedDifficulty}
        </span>{" "}
        level.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          onClick={onNext}
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            padding: "16px 40px",
            background: "transparent",
            color: "var(--v9-sol-green)",
            border: "1px solid var(--v9-sol-green)",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(20, 241, 149, 0.08)";
            el.style.boxShadow = "0 0 24px rgba(20, 241, 149, 0.15)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "transparent";
            el.style.boxShadow = "none";
          }}
        >
          Next
        </button>
        <button
          onClick={onViewRecommendations}
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            padding: "16px 40px",
            background: "transparent",
            color: "var(--c-text-muted)",
            border: "1px solid var(--overlay-border)",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--c-text-muted)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--overlay-border)";
          }}
        >
          View Courses
        </button>
      </motion.div>
    </div>
  );
}
