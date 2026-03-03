"use client";

import { useReducedMotion, motion } from "framer-motion";

function Float({
  children,
  delay = 0,
  duration = 6,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{
        y: [0, -14, 0],
        rotate: [0, 4, -4, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section-specific floating element groups ── */

export function HeroFloatingElements() {
  return (
    <>
      <Float className="top-16 left-[6%] opacity-40" delay={0} duration={7}>
        <HexagonFilled className="h-12 w-12 text-primary" />
      </Float>
      <Float className="top-28 right-[8%] opacity-35" delay={1.5} duration={8}>
        <BracketIcon className="h-10 w-10 text-brazil-gold" />
      </Float>
      <Float className="bottom-20 left-[12%] opacity-30" delay={3} duration={6}>
        <DiamondFilled className="h-8 w-8 text-brazil-teal" />
      </Float>
      <Float
        className="bottom-12 right-[10%] opacity-35"
        delay={2}
        duration={9}
      >
        <CircuitIcon className="h-11 w-11 text-st-green" />
      </Float>
      <Float className="top-40 left-[22%] opacity-20" delay={4} duration={10}>
        <TriangleFilled className="h-16 w-16 text-brazil-coral" />
      </Float>
      <Float
        className="bottom-28 right-[20%] opacity-25"
        delay={1}
        duration={7.5}
      >
        <DotGridIcon className="h-14 w-14 text-primary" />
      </Float>
      <Float className="top-24 right-[30%] opacity-15" delay={2.5} duration={9}>
        <RingIcon className="h-20 w-20 text-brazil-gold" />
      </Float>
      <Float
        className="bottom-36 left-[30%] opacity-20"
        delay={3.5}
        duration={8}
      >
        <CrossIcon className="h-8 w-8 text-brazil-blue" />
      </Float>
    </>
  );
}

export function CTAFloatingElements() {
  return (
    <>
      <Float className="top-6 left-[4%] opacity-35" delay={0.5} duration={7}>
        <BracketIcon className="h-9 w-9 text-brazil-gold" />
      </Float>
      <Float className="bottom-6 right-[6%] opacity-30" delay={2} duration={8}>
        <HexagonFilled className="h-10 w-10 text-primary" />
      </Float>
      <Float className="top-12 right-[18%] opacity-25" delay={3.5} duration={9}>
        <CrossIcon className="h-8 w-8 text-brazil-teal" />
      </Float>
      <Float
        className="bottom-10 left-[12%] opacity-20"
        delay={1.5}
        duration={6.5}
      >
        <DiamondFilled className="h-7 w-7 text-brazil-coral" />
      </Float>
      <Float className="top-1/2 left-[8%] opacity-15" delay={0} duration={10}>
        <RingIcon className="h-14 w-14 text-st-green" />
      </Float>
    </>
  );
}

export function SectionFloatingElements({
  variant = "a",
}: {
  variant?: "a" | "b" | "c";
}) {
  if (variant === "a") {
    return (
      <>
        <Float className="top-6 right-[3%] opacity-25" delay={0} duration={8}>
          <HexagonFilled className="h-10 w-10 text-primary" />
        </Float>
        <Float
          className="bottom-10 left-[2%] opacity-20"
          delay={2}
          duration={9}
        >
          <CrossIcon className="h-8 w-8 text-brazil-gold" />
        </Float>
        <Float
          className="top-1/2 left-[5%] opacity-15"
          delay={3.5}
          duration={7}
        >
          <DotGridIcon className="h-12 w-12 text-brazil-teal" />
        </Float>
        <Float
          className="top-1/3 right-[6%] opacity-20"
          delay={1}
          duration={10}
        >
          <DiamondFilled className="h-7 w-7 text-brazil-coral" />
        </Float>
        <Float
          className="bottom-1/4 right-[4%] opacity-10"
          delay={4}
          duration={8.5}
        >
          <RingIcon className="h-16 w-16 text-st-green" />
        </Float>
      </>
    );
  }
  if (variant === "b") {
    return (
      <>
        <Float className="top-10 left-[3%] opacity-25" delay={1} duration={7.5}>
          <DiamondFilled className="h-9 w-9 text-brazil-coral" />
        </Float>
        <Float
          className="bottom-6 right-[4%] opacity-20"
          delay={0.5}
          duration={8.5}
        >
          <BracketIcon className="h-8 w-8 text-st-green" />
        </Float>
        <Float
          className="top-1/3 right-[3%] opacity-15"
          delay={2.5}
          duration={10}
        >
          <TriangleFilled className="h-12 w-12 text-brazil-gold" />
        </Float>
        <Float
          className="bottom-1/3 left-[5%] opacity-20"
          delay={3}
          duration={7}
        >
          <CircuitIcon className="h-9 w-9 text-primary" />
        </Float>
        <Float className="top-2/3 right-[7%] opacity-10" delay={0} duration={9}>
          <RingIcon className="h-14 w-14 text-brazil-teal" />
        </Float>
      </>
    );
  }
  return (
    <>
      <Float className="top-8 right-[2%] opacity-25" delay={1.5} duration={9}>
        <CircuitIcon className="h-9 w-9 text-primary" />
      </Float>
      <Float className="bottom-8 left-[3%] opacity-20" delay={0} duration={7}>
        <HexagonFilled className="h-8 w-8 text-brazil-teal" />
      </Float>
      <Float className="top-1/2 left-[6%] opacity-15" delay={2} duration={8}>
        <TriangleFilled className="h-10 w-10 text-brazil-gold" />
      </Float>
      <Float className="top-1/4 right-[5%] opacity-20" delay={3} duration={6.5}>
        <CrossIcon className="h-7 w-7 text-brazil-coral" />
      </Float>
    </>
  );
}

/* ── SVG shape primitives ── */

function HexagonFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function BracketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={className}
    >
      <path d="M8 3H6a2 2 0 00-2 2v4l2 3-2 3v4a2 2 0 002 2h2M16 3h2a2 2 0 012 2v4l-2 3 2 3v4a2 2 0 01-2 2h-2" />
    </svg>
  );
}

function DiamondFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2l10 10-10 10L2 12 12 2z"
        fill="currentColor"
        opacity={0.15}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function CircuitIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity={0.12} />
      <path d="M12 2v7M12 15v7M2 12h7M15 12h7" />
    </svg>
  );
}

function TriangleFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M12 3l10 18H2L12 3z"
        fill="currentColor"
        opacity={0.12}
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className={className}
    >
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

function DotGridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="4" cy="4" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="20" cy="4" r="2" />
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="20" cy="12" r="2" />
      <circle cx="4" cy="20" r="2" />
      <circle cx="12" cy="20" r="2" />
      <circle cx="20" cy="20" r="2" />
    </svg>
  );
}

function RingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="5" opacity={0.4} />
    </svg>
  );
}
