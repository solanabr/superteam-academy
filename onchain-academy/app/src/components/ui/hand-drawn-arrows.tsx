"use client";

import React, { useEffect, useRef, useState } from "react";

const CAVEAT = "var(--font-caveat), 'Caveat', cursive";

// ─── Draw-in animation hook ───────────────────────────────────
function useDrawIn(delay = 0) {
  const ref = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const timer = setTimeout(() => {
      path.style.transition = `stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)`;
      path.style.strokeDashoffset = "0";
      setTimeout(() => setDrawn(true), 1400);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return { ref, drawn };
}

// ─── Swirl Arrow ──────────────────────────────────────────────
// A classic hand-drawn swirl that curves from left to right-down
export function SwirlArrow({
  color = "var(--xp)",
  width = 160,
  height = 100,
  delay = 0,
  label,
  labelPosition = "start",
  style,
}: {
  color?: string;
  width?: number;
  height?: number;
  delay?: number;
  label?: string;
  labelPosition?: "start" | "end";
  style?: React.CSSProperties;
}) {
  const { ref, drawn } = useDrawIn(delay);

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      <svg
        viewBox="0 0 160 100"
        width={width}
        height={height}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <path
          ref={ref}
          d="M8,80 C20,78 35,15 70,25 C105,35 85,80 120,60 C140,48 150,35 155,25"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrowhead */}
        <polygon
          points="150,18 158,26 148,30"
          fill={color}
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      </svg>
      {label && (
        <span
          style={{
            position: "absolute",
            ...(labelPosition === "start"
              ? { bottom: -2, left: 0 }
              : { top: -4, right: 0 }),
            fontFamily: CAVEAT,
            fontSize: "clamp(16px, 2.5vw, 22px)",
            color,
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.4s ease",
            whiteSpace: "nowrap",
            transform:
              labelPosition === "start" ? "rotate(-5deg)" : "rotate(-3deg)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Curved Pointer ───────────────────────────────────────────
// Points downward — good for "click here" annotations
export function CurvedPointer({
  color = "var(--xp)",
  width = 100,
  height = 80,
  delay = 0,
  label,
  style,
}: {
  color?: string;
  width?: number;
  height?: number;
  delay?: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  const { ref, drawn } = useDrawIn(delay);

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {label && (
        <span
          style={{
            position: "absolute",
            top: -24,
            left: "50%",
            transform: "translateX(-50%) rotate(-3deg)",
            fontFamily: CAVEAT,
            fontSize: "clamp(15px, 2vw, 20px)",
            color,
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.4s ease",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      <svg
        viewBox="0 0 100 80"
        width={width}
        height={height}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <path
          ref={ref}
          d="M50,5 C42,18 35,30 32,42 C28,58 38,65 48,70"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <polygon
          points="43,65 53,73 46,76"
          fill={color}
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      </svg>
    </div>
  );
}

// ─── Loopy Arrow ──────────────────────────────────────────────
// Playful with a loop — draws attention in a fun way
export function LoopyArrow({
  color = "var(--xp)",
  width = 180,
  height = 100,
  delay = 0,
  label,
  style,
}: {
  color?: string;
  width?: number;
  height?: number;
  delay?: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const timer = setTimeout(() => {
      path.style.transition = `stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)`;
      path.style.strokeDashoffset = "0";
      setTimeout(() => setDrawn(true), 2000);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      <svg
        viewBox="0 0 180 100"
        width={width}
        height={height}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <path
          ref={pathRef}
          d="M10,55 C25,15 55,15 60,45 C65,75 40,80 40,50 C40,20 70,5 100,25 C130,45 115,80 140,60 C155,48 165,35 172,28"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <polygon
          points="167,20 177,28 165,32"
          fill={color}
          style={{
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      </svg>
      {label && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: 0,
            fontFamily: CAVEAT,
            fontSize: "clamp(15px, 2vw, 20px)",
            color,
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.4s ease 0.2s",
            whiteSpace: "nowrap",
            transform: "rotate(-5deg)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Circle Highlight ─────────────────────────────────────────
// Dashed circle that draws around something + label
export function CircleHighlight({
  color = "var(--xp)",
  size = 80,
  delay = 0,
  label,
  style,
}: {
  color?: string;
  size?: number;
  delay?: number;
  label?: string;
  style?: React.CSSProperties;
}) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;
    const r = size / 2 - 4;
    const circ = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${circ}`;
    circle.style.strokeDashoffset = `${circ}`;

    const timer = setTimeout(() => {
      circle.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)`;
      circle.style.strokeDashoffset = "0";
      setTimeout(() => setDrawn(true), 1200);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, size]);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="6,4"
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span
          style={{
            position: "absolute",
            top: -22,
            left: "50%",
            transform: "translateX(-50%) rotate(-4deg)",
            fontFamily: CAVEAT,
            fontSize: 18,
            color,
            opacity: drawn ? 1 : 0,
            transition: "opacity 0.4s ease",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Handwritten Label ────────────────────────────────────────
// Standalone handwritten text with optional underline squiggle
export function HandLabel({
  children,
  color = "var(--xp)",
  size = 20,
  rotate = -3,
  underline = false,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  rotate?: number;
  underline?: boolean;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      style={{
        fontFamily: CAVEAT,
        fontSize: size,
        color,
        transform: `rotate(${rotate}deg)`,
        display: "inline-block",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        position: "relative",
        ...style,
      }}
    >
      {children}
      {underline && (
        <svg
          viewBox="0 0 100 8"
          style={{
            position: "absolute",
            bottom: -4,
            left: 0,
            width: "100%",
            height: 8,
            overflow: "visible",
          }}
          fill="none"
        >
          <path
            d="M2,5 C20,2 40,8 60,4 C80,0 95,6 98,4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              opacity: visible ? 0.7 : 0,
              transition: "opacity 0.4s ease 0.3s",
            }}
          />
        </svg>
      )}
    </span>
  );
}
