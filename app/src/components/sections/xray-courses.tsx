"use client";

import { useCallback, useRef } from "react";
import { ArrowRight } from "lucide-react";

// Real course data from curriculum-data.ts
const courses = [
  {
    id: "01",
    name: "Intro to",
    sub: "Solana",
    revealName: "Initialize",
    revealSub: "Sequence",
    xp: 500,
    color: "#EF4444",
    status: "12 LESSONS",
    meta: "BEGINNER",
    href: "/courses/intro-to-solana",
  },
  {
    id: "02",
    name: "Anchor",
    sub: "Development",
    revealName: "Deploy",
    revealSub: "Contract",
    xp: 800,
    color: "#9945FF",
    status: "15 LESSONS",
    meta: "INTERMEDIATE",
    href: "/courses/anchor-development",
  },
  {
    id: "03",
    name: "Frontend",
    sub: "React",
    revealName: "Mount",
    revealSub: "Component",
    xp: 650,
    color: "#0ea5e9",
    status: "10 LESSONS",
    meta: "BEGINNER",
    href: "/courses/frontend-with-react",
  },
  {
    id: "04",
    name: "DeFi",
    sub: "Fundamentals",
    revealName: "Execute",
    revealSub: "Swap",
    xp: 700,
    color: "#00FFA3",
    status: "8 LESSONS",
    meta: "INTERMEDIATE",
    href: "/courses/defi-fundamentals",
  },
  {
    id: "05",
    name: "Security",
    sub: "Essentials",
    revealName: "Audit",
    revealSub: "Contract",
    xp: 900,
    color: "#F48252",
    status: "10 LESSONS",
    meta: "ADVANCED",
    href: "/courses/solana-security",
  },
  {
    id: "06",
    name: "Mobile",
    sub: "dApps",
    revealName: "Ship",
    revealSub: "Native",
    xp: 750,
    color: "#EC4899",
    status: "8 LESSONS",
    meta: "INTERMEDIATE",
    href: "/courses/mobile-solana-react-native",
  },
];

interface XRayCoursesProps {
  locale: string;
}

export function XRayCourses({ locale }: XRayCoursesProps) {
  // Cache rect to avoid getBoundingClientRect on every mousemove
  const cachedRect = useRef<DOMRect | null>(null);
  const cachedEl = useRef<HTMLDivElement | null>(null);
  const raf = useRef(0);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      cachedEl.current = e.currentTarget;
      cachedRect.current = e.currentTarget.getBoundingClientRect();
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = cachedRect.current;
      const el = cachedEl.current;
      if (!rect || !el) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Batch into a single rAF — skip if one is already queued
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        el.style.setProperty("--mouse-x", `${x}px`);
        el.style.setProperty("--mouse-y", `${y}px`);
        raf.current = 0;
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    cachedRect.current = null;
    cachedEl.current = null;
    if (raf.current) {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    }
  }, []);

  return (
    <section className="pt-20 pb-0 border-t border-white/10">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 mb-12 md:mb-20 flex justify-between items-end">
        <h2
          className="text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-none font-black"
          style={{ mixBlendMode: "difference" }}
        >
          Scan <br />
          <span
            className="italic text-[#00FFA3]"
            style={{
              fontFamily:
                "var(--font-instrument-serif), 'Instrument Serif', serif",
            }}
          >
            Modules.
          </span>
        </h2>
        <p
          className="text-xs text-white/60 hidden md:block"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          // HOVER TO REVEAL SOURCE DATA
        </p>
      </div>

      {courses.map((c) => (
        <div
          key={c.id}
          className="xray-row relative border-b border-white/10 cursor-pointer overflow-hidden"
          style={
            {
              padding: "clamp(40px, 8vw, 120px) clamp(20px, 4vw, 60px)",
              "--xray-color": c.color,
              "--mouse-x": "50%",
              "--mouse-y": "50%",
            } as React.CSSProperties
          }
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Base dark layer */}
          <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8">
            <div className="flex gap-4 md:gap-8 items-center w-full md:w-1/2">
              <span
                className="text-2xl md:text-4xl text-white/60"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {c.id}_
              </span>
              <h3 className="text-[clamp(2rem,6vw,8rem)] font-black tracking-tighter leading-none uppercase">
                {c.name}
                <br />
                <span className="text-white/60">{c.sub}</span>
              </h3>
            </div>
            <div
              className="text-right flex flex-col items-end"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span className="text-[10px] text-white/60 uppercase tracking-widest mb-2">
                [STATUS: LOCKED]
              </span>
              <span className="text-xl md:text-2xl text-white">
                +{c.xp} XP
              </span>
            </div>
          </div>

          {/* X-ray reveal layer */}
          <div
            className="xray-reveal absolute inset-0 z-20 pointer-events-none flex items-center"
            style={{
              background: c.color,
              clipPath:
                "circle(0px at var(--mouse-x, 50%) var(--mouse-y, 50%))",
              padding: "0 clamp(20px, 4vw, 60px)",
            }}
          >
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8 text-black max-w-screen-2xl mx-auto">
              <div className="flex gap-4 md:gap-8 items-center w-full md:w-1/2">
                <span
                  className="text-2xl md:text-4xl font-bold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {c.id}_
                </span>
                <h3 className="text-[clamp(2rem,6vw,8rem)] font-black tracking-tighter leading-none uppercase drop-shadow-md">
                  {c.revealName}
                  <br />
                  {c.revealSub}
                </h3>
              </div>
              <div
                className="flex items-center gap-4 md:gap-8"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-widest font-bold mb-1">
                    {c.status}
                  </span>
                  <span className="block text-sm">{c.meta}</span>
                </div>
                <a
                  href={`/${locale}${c.href}`}
                  className="pointer-events-auto bg-black px-6 md:px-8 py-3 md:py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3"
                  style={{ color: c.color }}
                >
                  Enter Node{" "}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
