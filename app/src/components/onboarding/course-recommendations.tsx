"use client";

import React from "react";
import { motion } from "framer-motion";
import type { Course, Track, Difficulty } from "@/lib/services/types";
import {
  TRACK_LABELS,
  TRACK_COLORS,
  DIFFICULTY_COLORS,
} from "@/lib/constants";

interface CourseRecommendationsProps {
  courses: Course[];
  track: Track;
  difficulty: Difficulty;
  onComplete: () => void;
  onBrowseAll: () => void;
}

export function CourseRecommendations({
  courses,
  track,
  difficulty,
  onComplete,
  onBrowseAll,
}: CourseRecommendationsProps) {
  const trackColor = TRACK_COLORS[track];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Label */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: "var(--c-text-dim)",
          marginBottom: 12,
        }}
      >
        YOUR PATH
      </motion.p>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(24px, 4vw, 36px)",
          fontWeight: 400,
          color: "var(--foreground)",
          textAlign: "center",
          lineHeight: 1.15,
          margin: "0 0 8px",
        }}
      >
        Recommended{" "}
        <span style={{ fontStyle: "italic", color: trackColor }}>
          Courses
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          color: "var(--c-text-muted)",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Curated for the{" "}
        <span style={{ color: trackColor }}>
          {TRACK_LABELS[track]}
        </span>{" "}
        track at{" "}
        <span style={{ color: DIFFICULTY_COLORS[difficulty] }}>
          {difficulty}
        </span>{" "}
        level
      </motion.p>

      {/* Course cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 520,
          marginBottom: 36,
        }}
      >
        {courses.map((course, i) => {
          const cTrackColor = TRACK_COLORS[course.track];
          const cDiffColor = DIFFICULTY_COLORS[course.difficulty];

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.25 + i * 0.1,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                padding: "18px 20px",
                border: "1px solid var(--overlay-divider)",
                background: "transparent",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = `${cTrackColor}33`;
                el.style.background = `${cTrackColor}05`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "var(--overlay-divider)";
                el.style.background = "transparent";
              }}
            >
              {/* Top row: badges */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                    color: cTrackColor,
                    padding: "2px 8px",
                    border: `1px solid ${cTrackColor}30`,
                  }}
                >
                  {TRACK_LABELS[course.track]}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                    color: cDiffColor,
                    padding: "2px 8px",
                    border: `1px solid ${cDiffColor}30`,
                  }}
                >
                  {course.difficulty}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 20,
                  fontWeight: 400,
                  color: "var(--foreground)",
                  margin: "0 0 8px",
                  lineHeight: 1.2,
                }}
              >
                {course.title}
              </h3>

              {/* Description (truncated) */}
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  color: "var(--c-text-muted)",
                  lineHeight: 1.5,
                  margin: "0 0 14px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}
              >
                {course.description}
              </p>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  borderTop: "1px solid var(--overlay-divider)",
                  paddingTop: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    color: "var(--c-text-dim)",
                  }}
                >
                  <span
                    style={{
                      color: "var(--xp)",
                      fontWeight: 700,
                    }}
                  >
                    {course.xpReward}
                  </span>{" "}
                  XP
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    color: "var(--c-text-dim)",
                  }}
                >
                  <span style={{ color: "var(--c-text-2)", fontWeight: 500 }}>
                    {course.lessonCount}
                  </span>{" "}
                  lessons
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    color: "var(--c-text-dim)",
                  }}
                >
                  {course.duration}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.25 + courses.length * 0.1 + 0.1,
          duration: 0.5,
        }}
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Go to Dashboard */}
        <button
          onClick={onComplete}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            padding: "14px 36px",
            background: "transparent",
            color: "var(--xp)",
            border: "1px solid var(--xp)",
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
          Go to Dashboard
        </button>

        {/* Browse All */}
        <button
          onClick={onBrowseAll}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase" as const,
            padding: "14px 36px",
            background: "transparent",
            color: "var(--c-text-2)",
            border: "1px solid var(--overlay-divider)",
            cursor: "pointer",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--overlay-border)";
            el.style.color = "var(--foreground)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--overlay-divider)";
            el.style.color = "var(--c-text-2)";
          }}
        >
          Browse All Courses
        </button>
      </motion.div>
    </div>
  );
}
