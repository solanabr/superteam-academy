"use client";

import React from "react";
import { motion } from "framer-motion";

interface QuizProgressBarProps {
  current: number;
  total: number;
}

export function QuizProgressBar({ current, total }: QuizProgressBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;

        return (
          <motion.div
            key={i}
            animate={{
              width: isActive ? 28 : 8,
              background: isActive
                ? "var(--v9-sol-green)"
                : isCompleted
                  ? "rgba(20, 241, 149, 0.4)"
                  : "var(--overlay-divider)",
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: 4,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}
