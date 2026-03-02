"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  G,
  D,
  C,
  M,
  FONT_SANS,
  FONT_SERIF,
  CustomCursor,
  GlitchText,
  MagneticBtn,
} from "@/components/ui/landing-animations";
import { LazyConstellationCanvas } from "@/components/ui/lazy-constellation";
import { SwirlArrow } from "@/components/ui/hand-drawn-arrows";

// Below-fold sections: lazy-loaded so they don't block the hero LCP paint.
const MethodologySection = dynamic(
  () =>
    import("@/components/sections/methodology-section").then(
      (m) => m.MethodologySection,
    ),
  { ssr: false },
);
const MarqueeProof = dynamic(
  () =>
    import("@/components/sections/marquee-proof").then((m) => m.MarqueeProof),
  { ssr: false },
);
const PathMatrix = dynamic(
  () => import("@/components/sections/path-matrix").then((m) => m.PathMatrix),
  { ssr: false },
);
const XRayCourses = dynamic(
  () => import("@/components/sections/xray-courses").then((m) => m.XRayCourses),
  { ssr: false },
);
const SingularityCTA = dynamic(
  () =>
    import("@/components/sections/singularity-cta").then(
      (m) => m.SingularityCTA,
    ),
  { ssr: false },
);

export function LandingContent({
  stats,
  locale,
}: {
  stats: { courseCount: number; totalLessons: number; totalXP: number };
  locale: string;
}) {
  const t = useTranslations("landing");
  const router = useRouter();
  const [warping, setWarping] = useState(false);
  const [hoverSentinel, setHoverSentinel] = useState(false);
  const [sentinelVisible, setSentinelVisible] = useState(true);
  const streakLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSentinelVisible(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  const handleInitOnboarding = () => {
    if (warping) return;
    setWarping(true);

    if (streakLayerRef.current) {
      const container = streakLayerRef.current;
      container.innerHTML = "";
      for (let i = 0; i < 100; i++) {
        const streak = document.createElement("div");
        const angle = Math.random() * 360;
        const length = 80 + Math.random() * 200;
        const delay = Math.random() * 0.3;
        const duration = 0.6 + Math.random() * 0.5;
        streak.style.cssText = `
          position: absolute; top: 50%; left: 50%;
          width: ${length}px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(20,241,149,${0.3 + Math.random() * 0.5}), rgba(153,69,255,${0.2 + Math.random() * 0.3}), transparent);
          transform-origin: 0% 50%;
          --streak-angle: ${angle}deg;
          opacity: 0;
          animation: onb-streakJump ${duration}s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}s forwards;
        `;
        container.appendChild(streak);
      }
    }

    setTimeout(() => {
      router.push(`/${locale}/onboarding?start=1`);
    }, 1400);
  };

  return (
    <div
      className="landing-cursor"
      style={{
        background: D,
        color: C,
        perspective: warping ? "2000px" : undefined,
        overflow: warping ? "hidden" : undefined,
      }}
    >
      <CustomCursor />

      {/* Warp streak layer */}
      <div
        ref={streakLayerRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 500,
        }}
      />

      <div
        style={{
          transformStyle: "preserve-3d",
          transition: warping
            ? "all 1.2s cubic-bezier(0.7, 0, 0.1, 1)"
            : "none",
          transform: warping
            ? "translateZ(1200px) rotateX(-15deg) rotateY(5deg)"
            : "none",
          opacity: warping ? 0 : 1,
          filter: warping ? "blur(40px) brightness(2)" : "none",
        }}
      >
        {/* ──────────────── HERO ──────────────── */}
        <section
          className="landing-hero"
          style={{
            position: "relative",
            minHeight: "100vh",
            background: D,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <LazyConstellationCanvas />

          {/* ── Sentinel Trigger (right side) — auto-fades after 5s ── */}
          <div
            style={{
              position: "absolute",
              right: "clamp(24px, 5vw, 100px)",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              gap: 0,
              opacity: sentinelVisible || hoverSentinel ? 1 : 0,
              transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              pointerEvents: sentinelVisible || hoverSentinel ? "auto" : "none",
            }}
            onMouseEnter={() => setHoverSentinel(true)}
            onMouseLeave={() => setHoverSentinel(false)}
          >
            {/* Hand-drawn arrow — to the left, clear of the circle */}
            <div
              style={{
                position: "relative",
                marginRight: 12,
                marginTop: -30,
              }}
            >
              <SwirlArrow
                delay={1200}
                width={120}
                height={70}
                color={G}
                label={t("startOnboarding")}
                labelPosition="start"
              />
            </div>

            {/* Sentinel button */}
            <div
              onClick={handleInitOnboarding}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: hoverSentinel ? "scale(1.15)" : "scale(1)",
                }}
              >
                {/* Outer dashed ring — spins */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `1px dashed ${hoverSentinel ? G : "var(--overlay-border)"}`,
                    animation: hoverSentinel
                      ? "onb-rotate 2s linear infinite"
                      : "onb-rotate 6s linear infinite",
                    transition: "border-color 0.3s",
                  }}
                />
                {/* Center dot */}
                <div
                  style={{
                    width: hoverSentinel ? 14 : 8,
                    height: hoverSentinel ? 14 : 8,
                    borderRadius: "50%",
                    background: G,
                    boxShadow: hoverSentinel
                      ? `0 0 20px rgba(0,210,130,0.7), 0 0 40px rgba(0,210,130,0.3)`
                      : `0 0 8px rgba(0,210,130,0.4)`,
                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                />
              </div>
              {/* Label — pulses green */}
              <div
                style={{
                  writingMode: "vertical-rl",
                  fontFamily: FONT_SANS,
                  fontSize: 9,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: G,
                  userSelect: "none",
                  animation: "sentinel-pulse 2s ease-in-out infinite",
                }}
              >
                {t("startOnboarding").toUpperCase()}
              </div>
            </div>
          </div>

          {/* Grid overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(var(--overlay-divider) 1px, transparent 1px), linear-gradient(90deg, var(--overlay-divider) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Vertical accent lines */}
          {[20, 50, 80].map((p) => (
            <div
              key={p}
              style={{
                position: "absolute",
                top: 0,
                left: `${p}%`,
                width: "1px",
                height: "100%",
                background:
                  "linear-gradient(to bottom, transparent, rgba(0,210,130,0.04), transparent)",
                pointerEvents: "none",
              }}
            />
          ))}

          <div
            style={{
              position: "relative",
              zIndex: 10,
              padding: "0 clamp(20px, 5vw, 60px)",
              maxWidth: 1200,
            }}
          >
            {/* Eyebrow */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <div
                  className="sa-pulse-dot"
                  style={{
                    width: 6,
                    height: 6,
                    background: G,
                    borderRadius: "50%",
                  }}
                />
                <span
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 11,
                    letterSpacing: 4,
                    color: M,
                  }}
                >
                  {t("eyebrow")}
                </span>
              </div>
            </div>

            {/* Main headline */}
            <h1
              style={{
                fontFamily: FONT_SERIF,
                fontSize: "clamp(56px, 8vw, 110px)",
                fontWeight: 400,
                lineHeight: 0.95,
                margin: "0 0 20px",
                color: C,
              }}
            >
              {t("heroHeadline")}
              <br />
              <GlitchText>
                <span style={{ fontStyle: "italic", color: G }}>
                  {t("heroOnChain")}
                </span>
              </GlitchText>
            </h1>

            {/* Subtitle */}
            <div>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(16px, 2vw, 20px)",
                  color: "var(--c-text-muted)",
                  maxWidth: 560,
                  lineHeight: 1.6,
                  margin: "0 0 40px",
                }}
              >
                {t("heroSubtitle")}
              </p>
            </div>

            {/* CTAs */}
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 40,
                }}
              >
                <MagneticBtn primary href={`/${locale}/courses`}>
                  {t("exploreCourses")} →
                </MagneticBtn>
                <MagneticBtn href={`/${locale}/leaderboard`}>
                  {t("viewLeaderboard")}
                </MagneticBtn>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────── KINETIC STATS ──────────────── */}
        <section className="py-20 border-y border-white/5 bg-black/50 backdrop-blur-xl">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              {
                label: t("coursesLive"),
                display: String(stats.courseCount).padStart(2, "0"),
              },
              { label: t("totalLessons"), display: String(stats.totalLessons) },
              { label: t("activeBuilders"), display: "2.4k" },
              { label: t("xpAvailable"), display: "4.3k" },
            ].map((s, i) => (
              <div key={i} className="group">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/70 mb-4"
                  style={{ fontFamily: FONT_SANS }}
                >
                  {s.label}
                </p>
                <p
                  className="text-6xl md:text-8xl text-white group-hover:text-[#00FFA3] transition-colors duration-500"
                  style={{ fontFamily: FONT_SERIF, fontStyle: "italic" }}
                >
                  {s.display}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────── METHODOLOGY (V2) ──────────────── */}
        <MethodologySection />

        {/* ──────────────── PARTNER STRIP ──────────────── */}
        <section
          style={{
            padding: "48px 0",
            borderTop: "1px solid var(--overlay-divider)",
            borderBottom: "1px solid var(--overlay-divider)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
              textAlign: "center",
              margin: "0 0 24px",
            }}
          >
            {t("trustedBy")}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 32,
              flexWrap: "wrap",
              padding: "0 24px",
            }}
          >
            {[
              "SOLANA FOUNDATION",
              "HELIUS",
              "SUPERTEAM",
              "METAPLEX",
              "LIGHT PROTOCOL",
            ].map((name) => (
              <span
                key={name}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: "var(--c-text-dim)",
                  userSelect: "none",
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* ──────────────── MARQUEE SOCIAL PROOF (V2) ──────────────── */}
        <MarqueeProof />

        {/* ──────────────── PATH MATRIX (V2) ──────────────── */}
        <PathMatrix locale={locale} />

        {/* ──────────────── X-RAY COURSES (V2) ──────────────── */}
        <XRayCourses locale={locale} />

        {/* ──────────────── SINGULARITY CTA (V2) ──────────────── */}
        <SingularityCTA />
      </div>
      {/* end warp wrapper */}
    </div>
  );
}
