"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { formatNumber } from "@/lib/format";

export const G = "var(--nd-highlight-green)";
export const D = "var(--background)";
export const C = "var(--foreground)";
export const M = "var(--c-text-muted)";
export const BORDER = "var(--overlay-divider)";
export const SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";

export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}> = ({ children, delay = 0, direction = "up" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const transforms: Record<string, string> = {
    up: "translateY(50px)",
    down: "translateY(-50px)",
    left: "translateX(50px)",
    right: "translateX(-50px)",
  };

  return (
    <div
      ref={ref}
      style={{
        transform: visible ? "none" : transforms[direction],
        opacity: visible ? 1 : 0,
        transition: `all 0.9s ${SPRING}`,
      }}
    >
      {children}
    </div>
  );
};

export const TiltCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ children, style = {}, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(800px) rotateX(0deg) rotateY(0deg)",
  );
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform(
      `perspective(800px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 14}deg) scale(1.02)`,
    );
    setGlare({ x: x * 100, y: y * 100 });
  };

  const handleLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)");
    setGlare({ x: 50, y: 50 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{
        transform,
        transition: `transform 0.4s ${SPRING}`,
        transformStyle: "preserve-3d",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, var(--overlay-divider) 0%, transparent 60%)`,
          transition: "background 0.3s",
        }}
      />
    </div>
  );
};

export const AnimCounter: React.FC<{
  to: number;
  duration?: number;
  suffix?: string;
}> = ({ to, duration = 2200, suffix = "" }) => {
  const locale = useLocale();
  const [v, setV] = useState(0);
  const rafRef = useRef<number>(0);
  const started = useRef(false);
  const divRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    started.current = false;
    cancelAnimationFrame(rafRef.current);

    const el = divRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const s = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - s) / duration, 1);
            setV(Math.round((1 - Math.pow(1 - p, 4)) * to));
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => {
      cancelAnimationFrame(rafRef.current);
      obs.disconnect();
    };
  }, [to, duration]);

  return (
    <span ref={divRef}>
      {formatNumber(v, locale)}
      {suffix}
    </span>
  );
};

export const Ring: React.FC<{
  pct: number;
  size?: number;
  strokeW?: number;
  label: string;
}> = ({ pct, size = 64, strokeW = 3, label }) => {
  const r = (size - strokeW * 2) / 2;
  const circ = Math.PI * 2 * r;
  const [off, setOff] = useState(circ);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setOff(circ - (pct / 100) * circ), 400);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, circ]);

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,210,130,0.08)"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={G}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: `stroke-dashoffset 2s ${SPRING}` }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: C,
        }}
      >
        {label}
      </span>
    </div>
  );
};
