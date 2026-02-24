"use client";

import React, { useEffect, useRef, useState } from "react";

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
  const bgRef = useRef<HTMLDivElement>(null);
  const [hoverSentinel, setHoverSentinel] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!bgRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      bgRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(40px, 8vw, 120px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Animated background */}
      <div
        ref={bgRef}
        style={{
          position: "fixed",
          inset: "-60px",
          zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 25% 50%, rgba(20,241,149,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 75% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)
          `,
          pointerEvents: "none",
          transition: "transform 0.15s ease-out",
          willChange: "transform",
        }}
      />

      {/* Left — hero content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
        {/* Label */}
        <p
          style={{
            fontFamily: "var(--v9-mono)",
            fontSize: 9,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "var(--v9-sol-green)",
            marginBottom: 24,
            opacity: visible ? 0.8 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transition: "all 0.6s ease 0.2s",
          }}
        >
          SKILL ASSESSMENT // CALIBRATION
        </p>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(60px, 12vw, 160px)",
            fontWeight: 400,
            color: "var(--foreground)",
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: "-2px",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
          }}
        >
          Elevate
          <br />
          <span
            style={{
              fontStyle: "italic",
              backgroundImage:
                "linear-gradient(90deg, var(--v9-sol-green), #9945FF, var(--v9-sol-green))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "onb-shine 6s linear infinite",
            }}
          >
            on-chain.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15,
            lineHeight: 1.7,
            color: "var(--c-text-2)",
            maxWidth: 400,
            marginTop: 32,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.7s ease 0.5s",
          }}
        >
          Answer 8 quick questions so we can gauge your experience level and
          recommend the right learning path. It takes less than 2 minutes.
        </p>

        {/* Skip link */}
        <button
          onClick={onSkip}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            color: "var(--c-text-2)",
            background: "none",
            border: "none",
            cursor: "pointer",
            marginTop: 32,
            padding: "4px 0",
            transition: "color 0.3s",
            opacity: visible ? 1 : 0,
            transitionDelay: "0.7s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--c-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--c-text-2)";
          }}
        >
          Skip for now
        </button>
      </div>

      {/* Right — sentinel trigger */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          cursor: "pointer",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(20px)",
          transition: "opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s",
        }}
        onClick={onStart}
        onMouseEnter={() => setHoverSentinel(true)}
        onMouseLeave={() => setHoverSentinel(false)}
      >
        {/* Ring + core */}
        <div
          style={{
            position: "relative",
            width: 70,
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hoverSentinel ? "scale(1.15)" : "scale(1)",
          }}
        >
          {/* Rotating dashed ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `1px dashed ${hoverSentinel ? "var(--v9-sol-green)" : "rgba(255,255,255,0.25)"}`,
              animation: hoverSentinel
                ? "onb-rotate 4s linear infinite"
                : "onb-rotate 15s linear infinite",
              transition: "border-color 0.3s",
            }}
          />
          {/* Inner core */}
          <div
            style={{
              width: hoverSentinel ? 16 : 8,
              height: hoverSentinel ? 16 : 8,
              borderRadius: "50%",
              background: "var(--v9-sol-green)",
              boxShadow: hoverSentinel
                ? "0 0 20px rgba(20,241,149,0.6), 0 0 40px rgba(20,241,149,0.3)"
                : "0 0 8px rgba(20,241,149,0.4)",
              transition:
                "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>

        {/* Vertical label */}
        <div
          style={{
            writingMode: "vertical-rl",
            fontFamily: "var(--v9-mono)",
            fontSize: 9,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: hoverSentinel ? "var(--v9-sol-green)" : "var(--c-text-2)",
            transition: "color 0.3s",
            userSelect: "none",
          }}
        >
          INITIALIZE
        </div>
      </div>

    </div>
  );
}
