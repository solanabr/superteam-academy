"use client";

import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";

const FONT_SERIF = "var(--font-instrument-serif), 'Instrument Serif', serif";

const methodologyCards = [
  {
    color: "#00FFA3",
    label: "// IDENTITY",
    title: "On-Chain Credentials",
    desc: "Earn verifiable ZK compressed credentials on Solana. Your achievements live forever on-chain, proving your expertise cryptographically.",
    tags: ["Immutable", "Soulbound"],
    visualizer: "rings" as const,
    vizLabel: "ZKP_Auth",
  },
  {
    color: "#a855f7",
    label: "// PROGRESSION",
    title: "Gamified Learning",
    desc: "Earn XP, maintain streaks, unlock achievements, and climb the leaderboard as you learn. Education meets engaging progression systems.",
    tags: ["Global Rank", "Rewards"],
    visualizer: "bars" as const,
    vizLabel: "EXP_Stream",
  },
  {
    color: "#0ea5e9",
    label: "// EXECUTION",
    title: "Hands-on Coding",
    desc: "Write and run Solana programs directly in the browser with our integrated IDE. Zero local environment setup required, just build.",
    tags: ["In-Browser IDE", "Real-time"],
    visualizer: "terminal" as const,
    vizLabel: "Env_Terminal",
  },
];

function RingsVisualizer({ active }: { active: boolean }) {
  return (
    <div
      className={`w-24 h-24 border rounded-full flex items-center justify-center transition-colors duration-500 ${
        active ? "border-[#00FFA3]/50" : "border-white/10"
      }`}
      style={{ animation: active ? "spin 8s linear infinite" : "none" }}
    >
      <div
        className={`w-16 h-16 border-t-2 border-b-2 rounded-full flex items-center justify-center transition-colors duration-500 ${
          active ? "border-[#00FFA3]" : "border-[#00FFA3]/30"
        }`}
        style={{
          animation: active ? "spin 4s linear infinite reverse" : "none",
        }}
      >
        <Fingerprint
          className={`w-6 h-6 transition-colors duration-500 ${
            active ? "text-[#00FFA3]" : "text-[#00FFA3]/40"
          }`}
        />
      </div>
    </div>
  );
}

function BarsVisualizer({ active }: { active: boolean }) {
  const heights = [40, 80, 60, 100];
  return (
    <div className="flex items-end gap-2 h-20 w-24">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-full rounded-t-sm transition-colors duration-500 ${
            active ? "bg-[#a855f7]" : "bg-[#a855f7]/20"
          }`}
          style={{
            height: `${h}%`,
            animationName: active ? "pulseFast" : "none",
            animationDuration: "1s",
            animationTimingFunction: "cubic-bezier(0.4,0,0.6,1)",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function TerminalVisualizer({ active }: { active: boolean }) {
  const lines = [
    { text: "Loading dependencies...", delay: 200 },
    { text: "cargo build-sbf", delay: 500, white: true },
    { text: "Compiling logic", delay: 900, cursor: true },
  ];
  return (
    <div
      className="text-[10px] text-white/70 space-y-2 mt-4"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p className="text-[#0ea5e9]">{"> init workspace"}</p>
      {lines.map((line, i) => (
        <p
          key={i}
          className={`transition-opacity duration-400 ${line.white ? "text-white" : ""}`}
          style={{
            opacity: active ? 1 : 0,
            transitionDelay: active ? `${line.delay}ms` : "0ms",
          }}
        >
          {line.text}
          {line.cursor && (
            <span className="inline-block w-2 h-4 ml-1 bg-[#0ea5e9] animate-[blink_1s_step-end_infinite]" />
          )}
        </p>
      ))}
    </div>
  );
}

export function MethodologySection() {
  const [animatingCards, setAnimatingCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const delayTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number(entry.target.getAttribute("data-idx"));

          if (entry.isIntersecting) {
            // Card entered view — wait before starting animation
            if (!delayTimers.current.has(idx)) {
              const timer = setTimeout(() => {
                setAnimatingCards((prev) => new Set(prev).add(idx));
                delayTimers.current.delete(idx);
              }, 200);
              delayTimers.current.set(idx, timer);
            }
          } else {
            // Card left view — cancel pending timer, stop animation
            const pending = delayTimers.current.get(idx);
            if (pending) {
              clearTimeout(pending);
              delayTimers.current.delete(idx);
            }
            setAnimatingCards((prev) => {
              if (!prev.has(idx)) return prev;
              const next = new Set(prev);
              next.delete(idx);
              return next;
            });
          }
        }
      },
      { threshold: 0.5 },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      delayTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <section className="relative" style={{ height: "300vh" }}>
      {/* Pinned Left */}
      <div className="sticky top-0 h-screen flex items-center max-w-screen-2xl mx-auto w-full px-6 md:px-12 pointer-events-none z-10">
        <div className="w-full md:w-1/2">
          <p
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-[#00FFA3] mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Methodology
          </p>
          <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9] font-black text-[var(--foreground)]">
            Learn it.
            <br />
            <span className="text-white/70">Prove it.</span>
            <br />
            <span
              className="italic text-[#00FFA3]"
              style={{ fontFamily: FONT_SERIF }}
            >
              Own it.
            </span>
          </h2>
        </div>
      </div>

      {/* Scrollable Right */}
      <div
        className="max-w-screen-2xl mx-auto px-6 md:px-12 flex justify-end"
        style={{ marginTop: "-100vh", paddingBottom: "50vh" }}
      >
        <div className="w-full md:w-3/5 flex flex-col gap-12 pt-[20vh]">
          {methodologyCards.map((card, i) => {
            const active = animatingCards.has(i);
            return (
              <div
                key={i}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                data-idx={i}
                className={`group relative rounded-[2rem] p-6 md:p-10 overflow-hidden border transition-all duration-500 hover:-translate-y-2.5 ${
                  active ? "border-white/15" : "border-white/5"
                }`}
                style={
                  {
                    background: "rgba(10,10,10,0.6)",
                    backdropFilter: "blur(30px)",
                    marginBottom: "20vh",
                    "--card-color": card.color,
                  } as React.CSSProperties
                }
              >
                {/* Radial glow — active on scroll or hover */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
                    active
                      ? "opacity-[0.15]"
                      : "opacity-0 group-hover:opacity-[0.15]"
                  }`}
                  style={{
                    background: `radial-gradient(circle at 80% 50%, ${card.color} 0%, transparent 50%)`,
                    mixBlendMode: "screen",
                  }}
                />

                {/* Border highlight */}
                <div
                  className={`absolute inset-0 rounded-[2rem] border pointer-events-none transition-colors duration-500 ${
                    active
                      ? "border-white/15"
                      : "border-transparent group-hover:border-white/15"
                  }`}
                />

                <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative z-10">
                  {/* Visualizer panel */}
                  <div
                    className={`w-full md:w-1/3 aspect-square border border-white/5 rounded-2xl bg-black/40 ${
                      card.visualizer === "terminal"
                        ? "flex flex-col justify-center p-6"
                        : "flex items-center justify-center"
                    } relative overflow-hidden transition-colors duration-500`}
                  >
                    <div
                      className="absolute top-3 left-3 text-[9px] uppercase tracking-widest text-white/70"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {card.vizLabel}
                    </div>
                    {card.visualizer === "rings" && (
                      <RingsVisualizer active={active} />
                    )}
                    {card.visualizer === "bars" && (
                      <BarsVisualizer active={active} />
                    )}
                    {card.visualizer === "terminal" && (
                      <TerminalVisualizer active={active} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="w-full md:w-2/3 flex flex-col justify-center">
                    <p
                      className="text-[10px] uppercase tracking-widest mb-4"
                      style={{
                        color: card.color,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {card.label}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                      {card.title}
                    </h3>
                    <p className="text-base md:text-lg text-white/70 font-light leading-relaxed mb-8">
                      {card.desc}
                    </p>
                    <div className="flex gap-3 flex-wrap">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1.5 border border-white/10 rounded-full text-[9px] uppercase tracking-widest text-white/70 bg-white/5"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
