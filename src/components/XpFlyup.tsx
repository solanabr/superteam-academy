"use client";

import { useEffect, useState } from "react";

interface XpFlyupProps {
  amount: number;
  onDone?: () => void;
}

/**
 * Animated "+N XP" text that floats upward and fades out.
 * Mount it, it auto-unmounts after ~1.8 s via onDone callback.
 */
export function XpFlyup({ amount, onDone }: XpFlyupProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      aria-live="polite"
      aria-label={`+${amount} XP earned`}
      style={{
        position: "fixed",
        bottom: "6rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
        animation: "xp-flyup 1.8s ease-out forwards",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.4rem 1rem",
          borderRadius: "9999px",
          background: "linear-gradient(135deg, var(--solana-purple), var(--solana-green))",
          color: "#fff",
          fontWeight: 700,
          fontSize: "1.125rem",
          boxShadow: "0 4px 24px rgba(153,69,255,0.45)",
          letterSpacing: "-0.01em",
        }}
      >
        ⚡ +{amount} XP
      </span>
    </div>
  );
}
