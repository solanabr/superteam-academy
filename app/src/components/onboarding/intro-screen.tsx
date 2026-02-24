"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SwirlArrow, HandLabel } from "@/components/ui/hand-drawn-arrows";

interface IntroScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

const CAVEAT = "var(--font-caveat), 'Caveat', cursive";

export function IntroScreen({ onContinue, onSkip }: IntroScreenProps) {
  const t = useTranslations("onboarding");
  const [phase, setPhase] = useState(0);

  // Stagger content in
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      {/* Hand-drawn greeting */}
      <div
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: CAVEAT,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: "var(--v9-sol-green)",
            display: "block",
            transform: "rotate(-2deg)",
          }}
        >
          {t("heyBuilder")}
        </span>
      </div>

      {/* Main heading */}
      <h1
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(32px, 6vw, 52px)",
          fontWeight: 400,
          color: "var(--foreground)",
          lineHeight: 1.1,
          margin: "0 0 8px",
          letterSpacing: "-1px",
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
        }}
      >
        {t("introTitle")}
        <br />
        <span style={{ fontStyle: "italic", color: "var(--v9-sol-green)" }}>
          {t("introTitleAccent")}
        </span>
      </h1>

      {/* Divider line */}
      <div
        style={{
          width: 48,
          height: 1,
          background: "var(--overlay-divider)",
          margin: "24px 0",
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "scaleX(1)" : "scaleX(0)",
          transition: "all 0.6s ease",
        }}
      />

      {/* Explanation steps with hand-drawn elements */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
          maxWidth: 420,
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.7s ease",
        }}
      >
        {[
          {
            num: "01",
            text: t("introStep1"),
            note: t("introStep1Note"),
          },
          {
            num: "02",
            text: t("introStep2"),
            note: t("introStep2Note"),
          },
          {
            num: "03",
            text: t("introStep3"),
            note: t("introStep3Note"),
          },
        ].map((item, i) => (
          <div
            key={item.num}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              textAlign: "left",
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? "translateX(0)" : "translateX(-20px)",
              transition: `all 0.6s ease ${i * 0.15}s`,
            }}
          >
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 24,
                fontStyle: "italic",
                color: "var(--overlay-border)",
                flexShrink: 0,
                width: 30,
              }}
            >
              {item.num}
            </span>
            <div>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 14,
                  color: "var(--foreground)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {item.text}
              </p>
              <span
                style={{
                  fontFamily: CAVEAT,
                  fontSize: 15,
                  color: "var(--c-text-dim)",
                  transform: "rotate(-1deg)",
                  display: "inline-block",
                  marginTop: 2,
                }}
              >
                {item.note}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hand-drawn arrow pointing to CTA */}
      <div
        style={{
          marginTop: 24,
          opacity: phase >= 4 ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <SwirlArrow
          delay={phase >= 4 ? 0 : 99999}
          width={80}
          height={50}
          label={t("ready")}
          labelPosition="start"
          style={{ transform: "rotate(85deg) scaleX(-1)", margin: "0 auto" }}
        />
      </div>

      {/* CTA button */}
      <button
        onClick={onContinue}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          padding: "16px 48px",
          background: "transparent",
          color: "var(--v9-sol-green)",
          border: "1px solid var(--v9-sol-green)",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          marginTop: 16,
          opacity: phase >= 4 ? 1 : 0,
          transform: phase >= 4 ? "translateY(0)" : "translateY(12px)",
          transitionDelay: "0.3s",
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
        {t("beginAssessment")}
      </button>

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12,
          color: "var(--c-text-muted)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginTop: 16,
          padding: "4px 8px",
          transition: "color 0.3s",
          opacity: phase >= 4 ? 1 : 0,
          transitionDelay: "0.5s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--c-text-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--c-text-muted)";
        }}
      >
        {t("skip")}
      </button>

      {/* Handwritten aside */}
      <div
        style={{
          marginTop: 32,
          opacity: phase >= 4 ? 1 : 0,
          transition: "opacity 0.5s ease 0.6s",
        }}
      >
        <HandLabel
          size={14}
          color="var(--c-text-dim)"
          rotate={-2}
          delay={phase >= 4 ? 2400 : 99999}
        >
          {t("noWrongAnswers")}
        </HandLabel>
      </div>
    </div>
  );
}
