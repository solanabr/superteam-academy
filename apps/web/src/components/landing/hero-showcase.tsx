"use client";

import { useState, useEffect, useRef } from "react";
import {
  Fire,
  Lightning,
  Medal,
  CheckCircle,
  Trophy,
} from "@phosphor-icons/react";

/* ────────────────────────────────────────────────────────────────────
   Hero showcase — who you become, not what you type. A Builder ID card
   in the Solana gradient floats center stage; the loot you earn (XP,
   a live terminal, achievements, streaks, rank, a minted credential)
   orbits it on two parallax layers, while faint program code rains up
   behind everything on the deepest layer.
   Pure decoration (aria-hidden): the hero copy carries the semantics.
   Reduced motion: a static composition (blanket CSS rule + JS guards).
   ──────────────────────────────────────────────────────────────────── */

/* ── Code rain: the air this world breathes ── */
const RAIN_COLS: string[][] = [
  [
    "use anchor_lang::prelude::*;",
    "#[program]",
    "pub mod academy {",
    "let cert = &mut ctx.accounts;",
    "cert.owner = signer.key();",
    "Ok(())",
  ],
  [
    "#[derive(Accounts)]",
    "pub struct MintCert<'info> {",
    "#[account(mut)]",
    "pub signer: Signer<'info>,",
    "}",
    'declare_id!("ACAD...");',
  ],
  [
    "require!(xp > 0, NoXp);",
    'msg!("credential minted");',
    "emit!(CertMinted {});",
    "invoke_signed(&ix, ..)?;",
    "total_xp += 50;",
    "Ok(())",
  ],
];
const RAIN_LEFT = [6, 42, 76];
const RAIN_DUR = [26, 34, 22];

function CodeRain({ rainRef }: { rainRef?: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={rainRef}
      className="hero-rain pointer-events-none absolute inset-0 overflow-hidden transition-transform duration-300 ease-out will-change-transform"
    >
      {RAIN_COLS.map((lines, c) => (
        <div
          key={c}
          className="hero-rain-col absolute top-0 whitespace-nowrap font-mono text-[11px] leading-[2.2]"
          style={
            {
              left: `${RAIN_LEFT[c]}%`,
              "--rain-dur": `${RAIN_DUR[c]}s`,
            } as React.CSSProperties
          }
        >
          {Array(8)
            .fill(lines)
            .flat()
            .map((line: string, i) => (
              <div key={i}>{line}</div>
            ))}
        </div>
      ))}
    </div>
  );
}

/* ── Live terminal chip: one line of forever-working code ── */
const TERM_FALLBACK = { cmd: "anchor test", out: "✓ 3 passing" };
const TERM_LOOP = [
  TERM_FALLBACK,
  { cmd: "anchor build", out: "✓ compiled" },
  { cmd: "solana deploy", out: "✓ live on devnet" },
];

function TerminalChip() {
  const [step, setStep] = useState(0);
  const [chars, setChars] = useState(0);
  const [showOut, setShowOut] = useState(false);
  const reducedRef = useRef(false);

  const pair = TERM_LOOP[step % TERM_LOOP.length] ?? TERM_FALLBACK;

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedRef.current) {
      setChars(TERM_FALLBACK.cmd.length);
      setShowOut(true);
    }
  }, []);

  useEffect(() => {
    if (reducedRef.current) return;
    if (chars < pair.cmd.length) {
      const id = setTimeout(() => setChars((c) => c + 1), 55);
      return () => clearTimeout(id);
    }
    if (!showOut) {
      const id = setTimeout(() => setShowOut(true), 300);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setChars(0);
      setShowOut(false);
      setStep((s) => (s + 1) % TERM_LOOP.length);
    }, 2400);
    return () => clearTimeout(id);
  }, [chars, showOut, pair.cmd.length]);

  return (
    <div className="flex min-w-[210px] items-center gap-1.5 rounded-md border-[2.5px] border-border bg-card px-3 py-2 font-mono text-xs font-bold shadow-card">
      <span className="font-black text-primary">$</span>
      <span className="text-text-2">{pair.cmd.slice(0, chars)}</span>
      {chars < pair.cmd.length && (
        <span className="inline-block h-[12px] w-[6px] animate-pulse bg-primary opacity-80" />
      )}
      {showOut && <span className="term-out text-success">{pair.out}</span>}
    </div>
  );
}

function IdCard({
  cardRef,
  interactive,
}: {
  cardRef?: React.RefObject<HTMLDivElement>;
  interactive: boolean;
}) {
  return (
    <div
      ref={cardRef}
      className={`rounded-xl p-[2.5px] shadow-card [background:linear-gradient(135deg,#9945FF,#14F195)] ${
        interactive
          ? "hero-card-idle transition-transform duration-200 ease-out will-change-transform"
          : ""
      }`}
      style={interactive ? { transformStyle: "preserve-3d" } : undefined}
    >
      <div className="group relative overflow-hidden rounded-[10px] bg-card p-6">
        {/* sheen sweep on hover */}
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
          aria-hidden="true"
        />

        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            Builder ID
          </span>
          <span className="font-mono text-[10px] text-text-3">
            solana devnet
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-black text-white shadow-[0_4px_0_0_var(--xp-dark)] [background:linear-gradient(135deg,var(--xp),var(--xp-dark))]">
            5
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-black">
              you.sol
            </div>
            <div className="font-mono text-[11px] text-text-3">
              Level 5 · 3,036 XP
            </div>
          </div>
        </div>

        <div className="mt-5 h-2.5 overflow-hidden rounded-full border-[2px] border-border bg-subtle">
          <div className="h-full w-[84%] rounded-full [background:linear-gradient(90deg,var(--primary),var(--xp))]" />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-md border-[2px] border-[var(--success-border)] px-2 py-1 font-mono text-[10px] font-bold text-success">
            ● soulbound
          </span>
          <span className="font-mono text-[10px] text-text-3">◎ on Solana</span>
        </div>
      </div>
    </div>
  );
}

export function HeroShowcase({ compact = false }: { compact?: boolean }) {
  const rainRef = useRef<HTMLDivElement>(null); // deepest: drifts the most
  const farRef = useRef<HTMLDivElement>(null); // drifts with the cursor
  const nearRef = useRef<HTMLDivElement>(null); // drifts against it
  const cardRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef<boolean | null>(null);

  const isReduced = () => {
    if (reducedRef.current === null) {
      reducedRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }
    return reducedRef.current;
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReduced()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 … 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    if (rainRef.current)
      rainRef.current.style.transform = `translate3d(${x * 32}px, ${y * 24}px, 0)`;
    if (farRef.current)
      farRef.current.style.transform = `translate3d(${x * 22}px, ${y * 16}px, 0)`;
    if (nearRef.current)
      nearRef.current.style.transform = `translate3d(${x * -12}px, ${y * -9}px, 0)`;
    if (cardRef.current) {
      cardRef.current.classList.remove("hero-card-idle");
      cardRef.current.style.transform = `rotateX(${y * -7}deg) rotateY(${x * 9}deg)`;
    }
  };

  const handleLeave = () => {
    for (const ref of [rainRef, farRef, nearRef]) {
      if (ref.current) ref.current.style.transform = "";
    }
    if (cardRef.current) {
      cardRef.current.style.transform = "";
      cardRef.current.classList.add("hero-card-idle");
    }
  };

  if (compact) {
    // Touch devices get the scene without the cursor: rain, idle 3D sway,
    // the live terminal and the XP chip — all animation-driven.
    return (
      <div
        className="relative h-[400px] select-none overflow-hidden"
        aria-hidden="true"
      >
        <CodeRain />
        <div
          className="absolute left-1/2 top-1/2 w-[88%] max-w-[360px] -translate-x-1/2 -translate-y-1/2"
          style={{ perspective: "1000px" }}
        >
          <div
            className="hero-card-idle"
            style={{ transformStyle: "preserve-3d" }}
          >
            <IdCard interactive={false} />
          </div>
        </div>
        <div
          className="hero-loot absolute right-[3%] top-[5%] flex items-center gap-1.5 rounded-md border-[2.5px] border-[var(--accent-border)] bg-card px-3 py-2 font-mono text-sm font-black text-xp shadow-card"
          style={{ animationDelay: "0.7s, 1.3s" }}
        >
          <Lightning size={15} weight="fill" /> +50 XP
        </div>
        <div
          className="hero-loot absolute bottom-[5%] left-[2%] origin-left scale-90"
          style={{ animationDelay: "0.9s, 1.8s" }}
        >
          <TerminalChip />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[460px] select-none"
      style={{ perspective: "1200px" }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      aria-hidden="true"
    >
      {/* ── Deepest layer: program code raining up behind everything ── */}
      <CodeRain rainRef={rainRef} />

      {/* ── The Builder ID — center stage ── */}
      <div className="absolute left-1/2 top-1/2 w-[74%] max-w-[400px] -translate-x-1/2 -translate-y-1/2">
        <IdCard cardRef={cardRef} interactive />
      </div>

      {/* ── Far layer: drifts with the cursor ── */}
      <div
        ref={farRef}
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
      >
        <div
          className="hero-loot absolute left-[2%] top-[7%] flex items-center gap-1.5 rounded-md border-[2.5px] border-[var(--accent-border)] bg-card px-3 py-2 font-mono text-sm font-black text-xp shadow-card"
          style={{ animationDelay: "0.9s, 1.5s" }}
        >
          <Lightning size={15} weight="fill" /> +50 XP
        </div>
        <div
          className="hero-loot absolute bottom-[9%] right-[1%] flex items-center gap-1.5 rounded-md border-[2.5px] border-border bg-card px-3 py-2 font-mono text-sm font-black text-xp shadow-card"
          style={{ animationDelay: "1.15s, 1.9s" }}
        >
          <Fire size={15} weight="fill" /> 12
        </div>
        <div
          className="hero-loot absolute right-[0%] top-[40%] flex items-center gap-1.5 rounded-md border-[2.5px] border-border bg-card px-3 py-2 font-mono text-sm font-black text-text-2 shadow-card"
          style={{ animationDelay: "1.45s, 2.3s" }}
        >
          <Trophy size={15} weight="fill" className="text-xp" /> #4{" "}
          <span className="text-success">↑</span>
        </div>
      </div>

      {/* ── Near layer: drifts against the cursor ── */}
      <div
        ref={nearRef}
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
      >
        <div
          className="hero-loot absolute left-[-2%] top-[55%]"
          style={{ animationDelay: "1.05s, 2.2s" }}
        >
          <TerminalChip />
        </div>
        <div
          className="hero-loot absolute right-[3%] top-[4%] flex items-center gap-2 rounded-md border-[2.5px] border-border bg-card px-3 py-2 shadow-card"
          style={{ animationDelay: "1.25s, 1.95s" }}
        >
          <Medal size={16} weight="fill" className="text-xp" />
          <span className="font-mono text-xs font-bold text-text-2">
            Anchor Expert
          </span>
        </div>
        <div
          className="hero-loot absolute bottom-[4%] left-[8%] flex items-center gap-2 rounded-md border-[2.5px] border-border bg-card px-3 py-2 shadow-card"
          style={{ animationDelay: "1.35s, 2.5s" }}
        >
          <CheckCircle size={16} weight="fill" className="text-primary" />
          <span className="font-mono text-xs font-bold text-text-2">
            Credential minted
          </span>
        </div>
      </div>
    </div>
  );
}
