"use client";

import React, { useState, useEffect, useCallback } from "react";

const CAVEAT = "var(--font-caveat), 'Caveat', cursive";

interface TourStep {
  target: string; // CSS selector or "center" for freestanding
  title: string;
  description: string;
  handNote: string; // handwritten annotation
  arrowDir: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'a[href*="/courses"]',
    title: "Courses",
    description:
      "Browse all available tracks — Rust, DeFi, NFTs, and Frontend. Each course earns you XP and credentials.",
    handNote: "your learning paths live here",
    arrowDir: "top",
  },
  {
    target: 'a[href*="/dashboard"]',
    title: "Dashboard",
    description:
      "Track your XP, streaks, level progression, and earned credentials. Your mission control.",
    handNote: "all your stats at a glance",
    arrowDir: "top",
  },
  {
    target: 'a[href*="/leaderboard"]',
    title: "Leaderboard",
    description:
      "See how you stack up against other builders. Climb the ranks as you earn more XP.",
    handNote: "compete with fellow builders",
    arrowDir: "top",
  },
  {
    target: 'a[href*="/community"]',
    title: "Community",
    description:
      "Ask questions, share knowledge, and connect with other Solana developers.",
    handNote: "your builder tribe",
    arrowDir: "top",
  },
  {
    target: ".wallet-adapter-button",
    title: "Wallet",
    description:
      "Connect your Solana wallet to earn on-chain XP and soulbound credentials.",
    handNote: "connect to go on-chain",
    arrowDir: "top",
  },
];

// ─── SVG Arrow Paths ──────────────────────────────────────────
function TourArrow({
  direction,
  color = "var(--v9-sol-green)",
}: {
  direction: "top" | "bottom" | "left" | "right";
  color?: string;
}) {
  const paths: Record<string, { viewBox: string; d: string; head: string }> = {
    top: {
      viewBox: "0 0 60 50",
      d: "M30,48 C28,35 22,25 25,15 C28,8 32,5 35,8",
      head: "30,2 38,10 32,12",
    },
    bottom: {
      viewBox: "0 0 60 50",
      d: "M30,2 C28,15 22,25 25,35 C28,42 32,45 35,42",
      head: "30,48 38,40 32,38",
    },
    left: {
      viewBox: "0 0 60 40",
      d: "M58,20 C45,18 35,12 25,15 C15,18 10,22 12,25",
      head: "4,20 14,14 14,26",
    },
    right: {
      viewBox: "0 0 60 40",
      d: "M2,20 C15,18 25,12 35,15 C45,18 50,22 48,25",
      head: "56,20 46,14 46,26",
    },
  };

  const p = paths[direction];

  return (
    <svg
      viewBox={p.viewBox}
      width={60}
      height={direction === "left" || direction === "right" ? 40 : 50}
      fill="none"
      style={{ overflow: "visible" }}
    >
      <path
        d={p.d}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="200"
        strokeDashoffset="200"
        style={{
          animation: "tour-draw 0.8s ease forwards 0.3s",
        }}
      />
      <polygon
        points={p.head}
        fill={color}
        style={{
          opacity: 0,
          animation: "tour-fade 0.3s ease forwards 0.9s",
        }}
      />
    </svg>
  );
}

// ─── Tour Overlay ─────────────────────────────────────────────
export function GuidedTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);

  const step = TOUR_STEPS[currentStep];

  // Find and measure target element
  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      // Center fallback
      setTargetRect(
        new DOMRect(
          window.innerWidth / 2 - 60,
          80,
          120,
          40,
        ),
      );
    }
  }, [step]);

  useEffect(() => {
    setVisible(false);
    measureTarget();
    const timer = setTimeout(() => setVisible(true), 100);
    window.addEventListener("resize", measureTarget);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureTarget);
    };
  }, [currentStep, measureTarget]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!targetRect) return null;

  // Position tooltip below or above the target
  const tooltipTop =
    step.arrowDir === "top"
      ? targetRect.bottom + 60
      : targetRect.top - 260;
  const tooltipLeft = Math.max(
    16,
    Math.min(
      targetRect.left + targetRect.width / 2 - 160,
      window.innerWidth - 336,
    ),
  );

  return (
    <>
      {/* Dimming overlay with cutout */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "auto",
        }}
      >
        <svg width="100%" height="100%" style={{ display: "block" }}>
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target */}
      <div
        style={{
          position: "fixed",
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          border: "2px dashed var(--v9-sol-green)",
          borderRadius: 8,
          zIndex: 9999,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          transition: "all 0.4s ease",
          boxShadow: "0 0 20px rgba(20,241,149,0.2)",
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          left: tooltipLeft,
          top: tooltipTop,
          width: 320,
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Arrow pointing to target */}
        <div
          style={{
            position: "absolute",
            ...(step.arrowDir === "top"
              ? { top: -55, left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - tooltipLeft - 30, 10), 260) }
              : { bottom: -55, left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - tooltipLeft - 30, 10), 260) }),
          }}
        >
          <TourArrow direction={step.arrowDir} />
        </div>

        {/* Card content */}
        <div
          style={{
            background: "var(--background)",
            border: "1px solid var(--overlay-border)",
            padding: "24px",
            position: "relative",
          }}
        >
          {/* Step counter */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--overlay-border)",
              }}
            >
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 10,
                color: "var(--c-text-muted)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Skip tour
            </button>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--foreground)",
              margin: "0 0 8px",
            }}
          >
            {step.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 13,
              color: "var(--c-text-2)",
              lineHeight: 1.6,
              margin: "0 0 12px",
            }}
          >
            {step.description}
          </p>

          {/* Handwritten note */}
          <span
            style={{
              fontFamily: CAVEAT,
              fontSize: 17,
              color: "var(--v9-sol-green)",
              display: "block",
              transform: "rotate(-2deg)",
              marginBottom: 16,
            }}
          >
            {step.handNote}
          </span>

          {/* Next button */}
          <button
            onClick={handleNext}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "10px 28px",
              background: "transparent",
              color: "var(--v9-sol-green)",
              border: "1px solid var(--v9-sol-green)",
              cursor: "pointer",
              transition: "all 0.3s",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(20,241,149,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {currentStep < TOUR_STEPS.length - 1
              ? "Next"
              : "Start Learning"}
          </button>
        </div>
      </div>

    </>
  );
}
