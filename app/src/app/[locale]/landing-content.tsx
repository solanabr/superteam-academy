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
              animation:
                "hero-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {t("heroHeadline")}
            <br />
            <GlitchText>
              <span style={{ fontStyle: "italic", color: G }}>{t("heroOnChain")}</span>
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
              {t("heroSubtitle")}
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
                {t("viewLeaderboard")}
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
            { val: stats.courseCount, label: t("coursesLive") },
            { val: stats.totalLessons, label: t("totalLessons") },
            { val: 2400, label: t("activeBuilders"), suffix: "+" },
            { val: stats.totalXP, label: t("xpAvailable") },
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
            {t("whyOnChainLearning")}
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
            {t("featureHeadlinePart1")}{" "}
            <span style={{ color: G, fontStyle: "italic" }}>{t("featureHeadlineAccent")}</span> {t("featureHeadlinePart2")}
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

      {/* ──────────────── SOCIAL PROOF ──────────────── */}
      <section style={{ padding: "clamp(60px, 8vw, 120px) clamp(20px, 5vw, 60px)", borderTop: "1px solid var(--overlay-divider)", background: D }}>
        <Reveal>
          <p style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 4, color: M, marginBottom: 12 }}>
            {t("socialProof", { defaultMessage: "TRUSTED BY BUILDERS" })}
          </p>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, color: C, margin: "0 0 48px", lineHeight: 1.1 }}>
            {t("socialProofHeadline", { defaultMessage: "Builders ship faster with Superteam Academy" })}
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { name: "Alex R.", role: t("testimonialRole1", { defaultMessage: "Anchor Developer" }), quote: t("testimonial1", { defaultMessage: "The hands-on challenges made Anchor click for me. Went from zero to deploying my first program in two weeks." }) },
            { name: "Maria S.", role: t("testimonialRole2", { defaultMessage: "Full-Stack Builder" }), quote: t("testimonial2", { defaultMessage: "On-chain credentials that actually prove your skills. This is what Web3 education should look like." }) },
            { name: "Carlos M.", role: t("testimonialRole3", { defaultMessage: "DeFi Protocol Dev" }), quote: t("testimonial3", { defaultMessage: "The security track helped me audit my own protocol. Found two critical bugs before launch." }) },
          ].map((testimonial, i) => (
            <Reveal key={i} delay={i * 150}>
              <div style={{ padding: "32px 28px", border: "1px solid var(--overlay-divider)", background: "var(--overlay-divider)" }}>
                <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: C, lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontSize: 14, fontWeight: 700, color: D }}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C, margin: 0 }}>{testimonial.name}</p>
                    <p style={{ fontFamily: FONT_SANS, fontSize: 11, color: M, margin: 0 }}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ──────────────── LEARNING PATHS ──────────────── */}
      <section style={{ padding: "clamp(60px, 8vw, 120px) clamp(20px, 5vw, 60px)", borderTop: "1px solid var(--overlay-divider)", background: D }}>
        <Reveal>
          <p style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 4, color: M, marginBottom: 12 }}>
            {t("learningPaths", { defaultMessage: "LEARNING PATHS" })}
          </p>
          <h2 style={{ fontFamily: FONT_SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, color: C, margin: "0 0 48px", lineHeight: 1.1 }}>
            {t("learningPathsHeadline", { defaultMessage: "Choose your track" })}
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
          {[
            { track: "Rust", color: "#EF4444", courses: 4, desc: t("rustPathDesc", { defaultMessage: "Master systems programming for Solana" }) },
            { track: "Anchor", color: "#9945FF", courses: 3, desc: t("anchorPathDesc", { defaultMessage: "Build programs with the Anchor framework" }) },
            { track: "Frontend", color: "#03E1FF", courses: 3, desc: t("frontendPathDesc", { defaultMessage: "Create dApp interfaces with React & Web3" }) },
            { track: "Security", color: "#FF6B35", courses: 2, desc: t("securityPathDesc", { defaultMessage: "Audit and secure Solana programs" }) },
            { track: "DeFi", color: "#00FFA3", courses: 2, desc: t("defiPathDesc", { defaultMessage: "Build decentralized finance protocols" }) },
            { track: "Mobile", color: "#CA9FF5", courses: 1, desc: t("mobilePathDesc", { defaultMessage: "Solana Mobile Stack development" }) },
          ].map((path, i) => (
            <Reveal key={i} delay={i * 100}>
              <TiltCard style={{ background: "var(--overlay-divider)", border: "1px solid var(--overlay-divider)", padding: "32px 24px", height: "100%" }}>
                <div style={{ width: 40, height: 4, background: path.color, marginBottom: 20 }} />
                <h3 style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C, margin: "0 0 8px" }}>{path.track}</h3>
                <p style={{ fontFamily: FONT_SANS, fontSize: 13, color: M, lineHeight: 1.6, margin: "0 0 16px" }}>{path.desc}</p>
                <p style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 2, color: path.color, textTransform: "uppercase" as const }}>
                  {path.courses} {t("coursesAvailable", { defaultMessage: "COURSES" })}
                </p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ──────────────── FEATURED COURSES ──────────────── */}
      <section style={{ padding: "clamp(60px, 8vw, 120px) clamp(20px, 5vw, 60px)", borderTop: "1px solid var(--overlay-divider)", background: D }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 4, color: M, marginBottom: 12 }}>
                {t("featuredCourses", { defaultMessage: "FEATURED COURSES" })}
              </p>
              <h2 style={{ fontFamily: FONT_SERIF, fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 400, color: C, margin: 0, lineHeight: 1.1 }}>
                {t("startLearning", { defaultMessage: "Start learning today" })}
              </h2>
            </div>
            <MagneticBtn href={`/${locale}/courses`}>
              {t("exploreCourses")} →
            </MagneticBtn>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
          {[
            { title: t("featuredCourse1", { defaultMessage: "Intro to Solana & Rust" }), track: "Rust", level: t("beginner", { defaultMessage: "Beginner" }), lessons: 12, xp: 600, color: "#EF4444" },
            { title: t("featuredCourse2", { defaultMessage: "Anchor Program Development" }), track: "Anchor", level: t("intermediate", { defaultMessage: "Intermediate" }), lessons: 15, xp: 900, color: "#9945FF" },
            { title: t("featuredCourse3", { defaultMessage: "Building Solana dApps" }), track: "Frontend", level: t("beginner", { defaultMessage: "Beginner" }), lessons: 10, xp: 500, color: "#03E1FF" },
          ].map((course, i) => (
            <Reveal key={i} delay={i * 150}>
              <TiltCard style={{ background: "var(--overlay-divider)", border: "1px solid var(--overlay-divider)", padding: 0, height: "100%", overflow: "hidden" }}>
                <div style={{ height: 4, background: course.color }} />
                <div style={{ padding: "28px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 10, letterSpacing: 2, padding: "4px 10px", border: `1px solid ${course.color}44`, color: course.color, textTransform: "uppercase" as const }}>{course.track}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: 10, letterSpacing: 2, color: M, textTransform: "uppercase" as const }}>{course.level}</span>
                  </div>
                  <h3 style={{ fontFamily: FONT_SANS, fontSize: 18, fontWeight: 700, color: C, margin: "0 0 12px", lineHeight: 1.3 }}>{course.title}</h3>
                  <div style={{ display: "flex", gap: 20, fontFamily: FONT_SANS, fontSize: 12, color: M }}>
                    <span>{course.lessons} {t("lessonsLabel", { defaultMessage: "lessons" })}</span>
                    <span style={{ color: G }}>+{course.xp} XP</span>
                  </div>
                </div>
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
