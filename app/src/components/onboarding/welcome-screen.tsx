"use client";

import React from "react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 9,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: "var(--c-text-dim)",
          marginBottom: 16,
        }}
      >
        ONBOARDING
      </motion.p>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 400,
          color: "var(--foreground)",
          lineHeight: 1.05,
          margin: "0 0 8px",
          letterSpacing: "-1px",
        }}
      >
        Welcome to
        <br />
        <span style={{ fontStyle: "italic", color: "var(--v9-sol-green)" }}>
          Superteam Academy
        </span>
      </motion.h1>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 48,
          height: 1,
          background: "var(--overlay-divider)",
          margin: "24px 0",
          transformOrigin: "center",
        }}
      />

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--c-text-2)",
          maxWidth: 440,
          margin: "0 0 40px",
        }}
      >
        Answer 8 quick questions so we can gauge your experience level and
        recommend the right learning path. It takes less than 2 minutes.
      </motion.p>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={onStart}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase" as const,
          padding: "16px 48px",
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
        Start Assessment
      </motion.button>

      {/* Skip link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        onClick={onSkip}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          color: "var(--c-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginTop: 20,
          padding: "4px 8px",
          transition: "color 0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--c-text-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--c-text-muted)";
        }}
      >
        Skip for now
      </motion.button>
    </motion.div>
  );
}
