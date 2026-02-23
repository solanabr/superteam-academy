"use client";

import confetti from "canvas-confetti";

const SOLANA_COLORS = ["#9945FF", "#14F195", "#00C2FF"];

export function fireSolanaConfetti() {
  const defaults = {
    colors: SOLANA_COLORS,
    spread: 100,
    ticks: 200,
    gravity: 0.8,
    scalar: 1.2,
    shapes: ["circle" as const, "square" as const],
  };

  confetti({ ...defaults, particleCount: 80, origin: { x: 0.3, y: 0.6 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: 0.7, y: 0.6 } });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 50, origin: { x: 0.5, y: 0.4 } });
  }, 200);
}
