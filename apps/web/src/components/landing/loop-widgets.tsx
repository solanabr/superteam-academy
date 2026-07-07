"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Fire, Lightning, CheckCircle, Circle } from "@phosphor-icons/react";

/* ────────────────────────────────────────────────────────────────────
   Landing "loop" widgets — the product loop rebuilt as live miniatures
   (BUILD: runnable tests · EARN: XP meter · PROVE: flippable credential).
   DOM + CSS only, no images: crisp at any size, and each one is a toy
   the visitor can poke. Code-artifact strings (test names, cert fields)
   stay in English like the hero terminal; UI labels arrive via props.
   ──────────────────────────────────────────────────────────────────── */

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fire once when the element scrolls into view. */
function useInViewOnce(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ── Shared chrome ── */

function FrameDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 border-b-[2.5px] border-border px-4 py-3">
      <div className="h-3 w-3 rounded-full border-[2px] [background:var(--danger-bg)] [border-color:var(--danger-border-s)]" />
      <div className="h-3 w-3 rounded-full border-[2px] [background:var(--accent-bg)] [border-color:var(--accent-border)]" />
      <div className="h-3 w-3 rounded-full border-[2px] [background:var(--success-bg)] [border-color:var(--success-border-s)]" />
      <span className="ml-2 font-mono text-xs text-text-3">{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   01 · BUILD — mini challenge: click "Run tests", watch them pass
   ════════════════════════════════════════════════════════════════════ */

const BUILD_TESTS = [
  "returns the mint address",
  "payer is the mint authority",
  "uses 9 decimals",
];

export function BuildWidget({
  runLabel,
  runningLabel,
  passedLabel,
}: {
  runLabel: string;
  runningLabel: string;
  passedLabel: string;
}) {
  const { ref, inView } = useInViewOnce();
  const [passedCount, setPassedCount] = useState(0);
  const [state, setState] = useState<"idle" | "running" | "passed">("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const run = useCallback(() => {
    clearTimers();
    if (prefersReducedMotion()) {
      setPassedCount(BUILD_TESTS.length);
      setState("passed");
      return;
    }
    setPassedCount(0);
    setState("running");
    BUILD_TESTS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setPassedCount(i + 1), 500 + i * 450)
      );
    });
    timers.current.push(
      setTimeout(() => setState("passed"), 500 + BUILD_TESTS.length * 450 + 150)
    );
  }, []);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(run, 500);
    return () => {
      clearTimeout(t);
      clearTimers();
    };
  }, [inView, run]);

  return (
    <div
      ref={ref}
      className="relative rounded-lg border-[2.5px] border-border bg-card shadow-card"
    >
      {state === "passed" && (
        <div
          className="term-xp-chip absolute -right-3 -top-3 z-10 rounded-md border-[2.5px] border-[var(--accent-border)] bg-card px-3 py-1.5 font-mono text-sm font-black text-xp shadow-card"
          aria-hidden="true"
        >
          +5 XP
        </div>
      )}

      <FrameDots label="create-mint.ts" />

      <div className="p-5 font-mono text-[13px] leading-relaxed">
        <div>
          <span className="text-secondary">const</span>{" "}
          <span className="text-text-2">mint</span>{" "}
          <span className="text-text-3">=</span>{" "}
          <span className="text-secondary">await</span>{" "}
          <span className="text-primary">createMint</span>
          <span className="text-text-3">(</span>
        </div>
        <div className="text-text-3">{"  "}connection, payer,</div>
        <div className="text-text-3">
          {"  "}payer.publicKey, <span className="text-text-2">null</span>,{" "}
          <span className="text-accent">9</span>
        </div>
        <div className="text-text-3">);</div>

        <div className="my-4 border-t-[2.5px] border-border" />

        <ul className="space-y-2">
          {BUILD_TESTS.map((test, i) => {
            const passed = passedCount > i;
            const runningNow = state === "running" && passedCount === i;
            return (
              <li key={test} className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="term-out shrink-0 text-success"
                  />
                ) : (
                  <Circle
                    size={16}
                    className={`shrink-0 text-text-3 ${runningNow ? "animate-pulse" : "opacity-40"}`}
                  />
                )}
                <span className={passed ? "text-text-2" : "text-text-3"}>
                  {test}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={state === "running"}
            className={`duration-[120ms] inline-flex cursor-pointer items-center gap-2 rounded-md border-none px-4 py-2 font-display text-sm font-extrabold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-[2px] disabled:pointer-events-none ${
              state === "passed"
                ? "bg-success shadow-[0_4px_0_0_var(--success-dark)]"
                : "bg-primary shadow-[0_4px_0_0_var(--primary-dark)] hover:bg-primary-hover"
            }`}
          >
            {state === "running" && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {state === "passed"
              ? `${passedLabel} ✓`
              : state === "running"
                ? runningLabel
                : `▶ ${runLabel}`}
          </button>
          {state === "passed" && (
            <span className="term-out font-mono text-xs text-success">
              3 passing (0.4s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   02 · EARN — XP meter: counter, bar fill, streak igniting, quest tick
   ════════════════════════════════════════════════════════════════════ */

const XP_FROM = 3011;
const XP_TO = 3036;
const STREAK_LIT = 5;

export function EarnWidget({ replayLabel }: { replayLabel: string }) {
  const { ref, inView } = useInViewOnce();
  const [runKey, setRunKey] = useState(0);
  const [started, setStarted] = useState(false);
  const [xp, setXp] = useState(XP_FROM);
  const [litFlames, setLitFlames] = useState(0);
  const [questDone, setQuestDone] = useState(false);
  const [popOrb, setPopOrb] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!inView) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (prefersReducedMotion()) {
      setStarted(true);
      setXp(XP_TO);
      setLitFlames(STREAK_LIT);
      setQuestDone(true);
      return;
    }

    setStarted(false);
    setXp(XP_FROM);
    setLitFlames(0);
    setQuestDone(false);
    setPopOrb(false);

    timers.current.push(setTimeout(() => setStarted(true), 350));

    // XP counter
    const dur = 900;
    const t0 = performance.now() + 350;
    const tick = () => {
      const p = Math.min((performance.now() - t0) / dur, 1);
      if (p >= 0) {
        const eased = 1 - Math.pow(1 - Math.max(p, 0), 3);
        setXp(Math.round(XP_FROM + eased * (XP_TO - XP_FROM)));
      }
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    for (let i = 0; i < STREAK_LIT; i++) {
      timers.current.push(setTimeout(() => setLitFlames(i + 1), 600 + i * 160));
    }
    timers.current.push(setTimeout(() => setQuestDone(true), 1450));
    timers.current.push(setTimeout(() => setPopOrb(true), 1650));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [inView, runKey]);

  const pct = started ? 88 : 71;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={replayLabel}
      onClick={() => setRunKey((k) => k + 1)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setRunKey((k) => k + 1);
        }
      }}
      className="relative cursor-pointer rounded-lg border-[2.5px] border-border bg-card shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {questDone && (
        <div
          className="term-xp-chip absolute -right-3 -top-3 z-10 rounded-md border-[2.5px] border-[var(--accent-border)] bg-card px-3 py-1.5 font-mono text-sm font-black text-xp shadow-card"
          aria-hidden="true"
        >
          +25 XP
        </div>
      )}

      <FrameDots label="dashboard" />

      <div className="p-5">
        {/* Level orb + XP counter */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-black text-white shadow-[0_4px_0_0_var(--xp-dark)] transition-transform duration-300 [background:linear-gradient(135deg,var(--xp),var(--xp-dark))] ${popOrb ? "scale-110" : ""}`}
            aria-hidden="true"
          >
            5
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-2xl font-black tabular-nums text-xp">
              {xp.toLocaleString()}
              <span className="ml-1 text-xs font-bold text-text-3">XP</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-[2px] border-border bg-subtle">
              <div
                className="h-full rounded-full transition-[width] duration-1000 ease-out [background:linear-gradient(90deg,var(--primary),var(--xp))]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak row */}
        <div className="mt-5 flex items-center gap-2" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => {
            const lit = i < litFlames;
            return (
              <div
                key={i}
                className={`flex h-8 flex-1 items-center justify-center rounded-md border-[2px] transition-colors duration-200 ${
                  lit
                    ? "border-[var(--accent-border)] [background:var(--xp-dim)]"
                    : "border-border bg-subtle"
                }`}
              >
                <Fire
                  size={14}
                  weight={lit ? "fill" : "regular"}
                  className={lit ? "text-xp" : "text-text-3 opacity-40"}
                />
              </div>
            );
          })}
        </div>

        {/* Daily quest */}
        <div className="mt-4 flex items-center justify-between rounded-md border-[2px] border-border bg-subtle px-3 py-2.5">
          <div className="flex items-center gap-2">
            {questDone ? (
              <CheckCircle
                size={16}
                weight="fill"
                className="term-out shrink-0 text-success"
              />
            ) : (
              <Circle size={16} className="shrink-0 text-text-3 opacity-40" />
            )}
            <span className="font-mono text-xs text-text-2">
              Complete a lesson
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-xs font-bold text-xp">
            <Lightning size={12} weight="fill" /> +25
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   03 · PROVE — soulbound credential: tilts with the cursor, flips on click
   ════════════════════════════════════════════════════════════════════ */

export function ProveWidget({ flipLabel }: { flipLabel: string }) {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    if (prefersReducedMotion()) return;
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  };

  const toggle = () => setFlipped((f) => !f);

  return (
    <div ref={frameRef} className="group" style={{ perspective: "1100px" }}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipLabel}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="relative block aspect-[8/5] w-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`,
          transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* ── Front: the certificate ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl p-[2.5px] shadow-card [background:linear-gradient(135deg,#9945FF,#14F195)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[9px] bg-card p-5 sm:p-6">
            {/* sheen sweep on hover */}
            <div
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />
            <div>
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Certificate of Completion
              </div>
              <div className="font-display text-xl font-black leading-tight sm:text-2xl">
                Anchor Framework Mastery
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-text-3">
                Rust &amp; Programs · Intermediate
              </div>
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-text-3">
                  Recipient
                </div>
                <div className="font-mono text-xs font-bold text-text-2">
                  you.sol
                </div>
              </div>
              <div className="rounded-md border-[2px] border-[var(--success-border)] px-2 py-1 font-mono text-[10px] font-bold text-success">
                ● soulbound
              </div>
            </div>
          </div>
        </div>

        {/* ── Back: the NFT details ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-xl p-[2.5px] shadow-card [background:linear-gradient(315deg,#9945FF,#14F195)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex h-full flex-col justify-between rounded-[9px] bg-card p-5 sm:p-6">
            <div>
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                NFT Details
              </div>
              <dl className="space-y-2 font-mono text-xs">
                {[
                  ["Standard", "Metaplex Core"],
                  ["Network", "Solana"],
                  ["Transferable", "Never"],
                  ["Mint", "FdvURR…zTJk"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="border-border/60 flex items-center justify-between border-b pb-1.5"
                  >
                    <dt className="text-text-3">{k}</dt>
                    <dd className="font-bold text-text-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="inline-flex items-center gap-1 self-start rounded-md border-[2px] border-[var(--primary-border)] px-2.5 py-1.5 font-mono text-[11px] font-bold text-primary">
              View on Explorer →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
