"use client";

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
  TiltCard,
  MagneticBtn,
  Reveal,
  Counter,
} from "@/components/ui/landing-animations";
import { LazyConstellationCanvas } from "@/components/ui/lazy-constellation";
import { SwirlArrow } from "@/components/ui/hand-drawn-arrows";

const CAVEAT = "var(--font-caveat), 'Caveat', cursive";

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

  const features = [
    { title: t("onChainCredentials"), desc: t("onChainCredentialsDesc") },
    { title: t("gamifiedLearning"), desc: t("gamifiedLearningDesc") },
    { title: t("handsonCoding"), desc: t("handsonCodingDesc") },
  ];

  const numerals = ["i", "ii", "iii"];

  return (
    <div className="landing-cursor" style={{ background: D, color: C, perspective: warping ? "2000px" : undefined, overflow: "hidden" }}>
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
          transition: warping ? "all 1.2s cubic-bezier(0.7, 0, 0.1, 1)" : "none",
          transform: warping ? "translateZ(1200px) rotateX(-15deg) rotateY(5deg)" : "translateZ(0)",
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
              label="Start onboarding"
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
              START ONBOARDING
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
          <div
            style={{
              animation:
                "hero-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards",
            }}
          >
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
                SUPERTEAM ACADEMY // BUILT ON SOLANA
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
              animation:
                "hero-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            Learn
            <br />
            <GlitchText>
              <span style={{ fontStyle: "italic", color: G }}>on-chain.</span>
            </GlitchText>
          </h1>

          {/* Subtitle */}
          <div
            style={{
              animation:
                "hero-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards",
            }}
          >
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
              Earn{" "}
              <span
                style={{
                  color: C,
                  fontWeight: 700,
                  padding: "2px 10px",
                  background: "var(--overlay-divider)",
                  fontSize: "0.85em",
                  letterSpacing: 2,
                }}
              >
                NFT CREDENTIALS
              </span>{" "}
              and{" "}
              <span
                style={{
                  color: G,
                  fontStyle: "italic",
                  fontFamily: FONT_SERIF,
                }}
              >
                on-chain XP
              </span>{" "}
              as you master Solana development with a{" "}
              <span style={{ color: "#a855f7", fontWeight: 700 }}>live</span>{" "}
              <span style={{ color: G, fontWeight: 700 }}>leaderboard</span>.
            </p>
          </div>

          {/* CTAs */}
          <div
            style={{
              animation:
                "hero-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) 300ms forwards",
            }}
          >
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
                View Leaderboard
              </MagneticBtn>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            flexWrap: "wrap",
            borderTop: "1px solid var(--overlay-divider)",
            background: "rgba(10, 10, 9, 0.85)",
            backdropFilter: "blur(12px)",
            zIndex: 20,
            animation:
              "hero-fade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1s backwards",
          }}
        >
          {[
            { val: stats.courseCount, label: "COURSES LIVE" },
            { val: stats.totalLessons, label: "TOTAL LESSONS" },
            { val: 2400, label: "ACTIVE BUILDERS", suffix: "+" },
            { val: stats.totalXP, label: "XP AVAILABLE" },
          ].map((s, i) => (
            <div key={i} className="landing-stat-item">
              <div
                className="landing-stat-value"
                style={{ fontFamily: FONT_SERIF, color: C }}
              >
                <Counter
                  to={s.val}
                  duration={2000 + i * 300}
                  suffix={s.suffix || ""}
                />
              </div>
              <div
                className="landing-stat-label"
                style={{ fontFamily: FONT_SANS, color: M, marginTop: 4 }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section
        className="landing-features"
        style={{
          background: D,
          position: "relative",
          borderTop: "1px solid var(--overlay-divider)",
        }}
      >
        <Reveal>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: 11,
              letterSpacing: 4,
              color: M,
              marginBottom: 12,
            }}
          >
            WHY ON-CHAIN LEARNING
          </p>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 400,
              color: C,
              margin: "0 0 60px",
              maxWidth: 700,
              lineHeight: 1.05,
            }}
          >
            Learn it. Prove it.{" "}
            <span style={{ color: G, fontStyle: "italic" }}>Own it</span> forever.
          </h2>
        </Reveal>

        <div
          className="landing-features-grid"
          style={{ display: "grid", gap: 2 }}
        >
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 200}>
              <TiltCard
                style={{
                  background: "var(--overlay-divider)",
                  border: "1px solid var(--overlay-divider)",
                  padding: "40px 32px",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 28,
                    color: G,
                    fontStyle: "italic",
                    display: "block",
                    marginBottom: 20,
                  }}
                >
                  {numerals[i]}
                </span>
                <h3
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 16,
                    fontWeight: 700,
                    color: C,
                    margin: "0 0 12px",
                    letterSpacing: 0.5,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: "var(--c-text-dim)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ──────────────── EDITORIAL CTA ──────────────── */}
      <section
        className="landing-cta-section"
        style={{
          textAlign: "center",
          borderTop: "1px solid var(--overlay-divider)",
        }}
      >
        <Reveal>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(40px, 7vw, 96px)",
              fontWeight: 400,
              fontStyle: "italic",
              letterSpacing: "-3px",
              color: C,
            }}
          >
            {t("ctaTitle")}
          </h2>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: 18,
              color: M,
              maxWidth: 500,
              margin: "24px auto 0",
              lineHeight: 1.5,
            }}
          >
            {t("ctaDescription")}
          </p>
          <div style={{ marginTop: 48 }}>
            <MagneticBtn primary href={`/${locale}/courses`}>
              {t("exploreCourses")} →
            </MagneticBtn>
          </div>
        </Reveal>
      </section>
      </div>{/* end warp wrapper */}

    </div>
  );
}
