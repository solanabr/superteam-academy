"use client";

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

export function LandingContent({
  stats,
  locale,
}: {
  stats: { courseCount: number; totalLessons: number; totalXP: number };
  locale: string;
}) {
  const t = useTranslations("landing");

  const features = [
    { title: t("onChainCredentials"), desc: t("onChainCredentialsDesc") },
    { title: t("gamifiedLearning"), desc: t("gamifiedLearningDesc") },
    { title: t("handsonCoding"), desc: t("handsonCodingDesc") },
  ];

  const numerals = ["i", "ii", "iii"];

  return (
    <div className="landing-cursor" style={{ background: D, color: C }}>
      <CustomCursor />
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
            Your credentials should be{" "}
            <span style={{ color: G, fontStyle: "italic" }}>yours</span> — not
            locked in someone else&apos;s database.
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
    </div>
  );
}
