"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomCursor } from "@/components/ui/landing-animations";
import { WalletGate } from "@/components/dashboard/wallet-gate";
import { useUser } from "@/lib/hooks/use-user";
import { useAllEnrollments } from "@/lib/hooks/use-all-enrollments";
import { courses } from "@/lib/services/courses";
import {
  calculateLevel,
  xpToNextLevel,
  xpForLevel,
  TRACK_LABELS,
} from "@/lib/constants";
import { DailyChallenges } from "@/components/gamification/daily-challenges";
import { SeasonalEventBanner } from "@/components/gamification/seasonal-event-banner";

const G = "var(--nd-highlight-green)";
const D = "var(--background)";
const C = "var(--foreground)";
const M = "var(--c-text-muted)";
const BORDER = "var(--overlay-divider)";
const SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";

// ─── SCROLL REVEAL ──────────────────────────────────────────
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}> = ({ children, delay = 0, direction = "up" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  const transforms: Record<string, string> = {
    up: "translateY(50px)",
    down: "translateY(-50px)",
    left: "translateX(50px)",
    right: "translateX(-50px)",
  };

  return (
    <div
      ref={ref}
      style={{
        transform: visible ? "none" : transforms[direction],
        opacity: visible ? 1 : 0,
        transition: `all 0.9s ${SPRING}`,
      }}
    >
      {children}
    </div>
  );
};

// ─── 3D TILT CARD ───────────────────────────────────────────
const TiltCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}> = ({ children, style = {}, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(800px) rotateX(0deg) rotateY(0deg)",
  );
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform(
      `perspective(800px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 14}deg) scale(1.02)`,
    );
    setGlare({ x: x * 100, y: y * 100 });
  };

  const handleLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)");
    setGlare({ x: 50, y: 50 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{
        transform,
        transition: `transform 0.4s ${SPRING}`,
        transformStyle: "preserve-3d",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, var(--overlay-divider) 0%, transparent 60%)`,
          transition: "background 0.3s",
        }}
      />
    </div>
  );
};

// ─── ANIMATED COUNTER ───────────────────────────────────────
const AnimCounter: React.FC<{
  to: number;
  duration?: number;
  suffix?: string;
}> = ({ to, duration = 2200, suffix = "" }) => {
  const [v, setV] = useState(0);
  const rafRef = useRef<number>(0);
  const started = useRef(false);
  const divRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Reset so animation replays when `to` changes (e.g. data loads async)
    started.current = false;
    cancelAnimationFrame(rafRef.current);

    const el = divRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const s = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - s) / duration, 1);
            setV(Math.round((1 - Math.pow(1 - p, 4)) * to));
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => {
      cancelAnimationFrame(rafRef.current);
      obs.disconnect();
    };
  }, [to, duration]);

  return (
    <span ref={divRef}>
      {v.toLocaleString()}
      {suffix}
    </span>
  );
};

// ─── RADIAL PROGRESS RING ───────────────────────────────────
const Ring: React.FC<{
  pct: number;
  size?: number;
  strokeW?: number;
  label: string;
}> = ({ pct, size = 64, strokeW = 3, label }) => {
  const r = (size - strokeW * 2) / 2;
  const circ = Math.PI * 2 * r;
  const [off, setOff] = useState(circ);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setOff(circ - (pct / 100) * circ), 400);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, circ]);

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,210,130,0.08)"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={G}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: `stroke-dashoffset 2s ${SPRING}` }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          color: C,
        }}
      >
        {label}
      </span>
    </div>
  );
};

// ─── XP ORBITAL CANVAS ──────────────────────────────────────
const OrbitalXP: React.FC<{
  xp?: number;
  level?: number;
}> = ({ xp = 960, level = 3 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width,
      h = rect.height,
      cx = w / 2,
      cy = h / 2;

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    canvas.addEventListener("mouseleave", () => {
      mouse.current = { x: -999, y: -999 };
    });

    const count = Math.min(Math.floor(xp / 10), 120);
    const particles = Array.from({ length: count }, (_, i) => ({
      orbit: 50 + Math.random() * 110,
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
      speed: 0.001 + Math.random() * 0.005,
      size: 0.8 + Math.random() * 2.5,
      brightness: 0.2 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpd: 0.008 + Math.random() * 0.025,
      wobbleAmp: 2 + Math.random() * 10,
      hue: 150 + Math.random() * 25,
      trail: [] as { x: number; y: number }[],
      layer: Math.floor(Math.random() * 3),
    }));

    let t = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      // Ambient glow
      const amb = ctx.createRadialGradient(cx, cy, 20, cx, cy, 170);
      amb.addColorStop(0, `rgba(0,210,130,${0.04 + Math.sin(t * 0.5) * 0.02})`);
      amb.addColorStop(1, "rgba(0,210,130,0)");
      ctx.fillStyle = amb;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fill();

      // Dashed orbit rings
      [65, 100, 140].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,210,130,${0.03 + Math.sin(t * 0.3 + i) * 0.015})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Particles
      particles.forEach((p) => {
        p.angle += p.speed * (1 + p.layer * 0.3);
        p.wobble += p.wobbleSpd;

        const wx = Math.sin(p.wobble) * p.wobbleAmp;
        const wy = Math.cos(p.wobble * 0.7) * p.wobbleAmp * 0.5;
        let x = cx + Math.cos(p.angle) * p.orbit + wx;
        let y = cy + Math.sin(p.angle) * p.orbit + wy;

        // Mouse repel
        const dx = x - mouse.current.x;
        const dy = y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const f = ((80 - dist) / 80) * 12;
          x += (dx / dist) * f;
          y += (dy / dist) * f;
        }

        p.trail.push({ x, y });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = (i / p.trail.length) * p.brightness * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
          ctx.strokeStyle = `hsla(${p.hue},80%,60%,${a})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Draw particle
        const pulse = 1 + Math.sin(t * 2.5 + p.angle * 3) * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},85%,65%,${p.brightness * 0.85})`;
        ctx.fill();

        // Particle glow
        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.brightness * 0.05})`;
        ctx.fill();
      });

      // Progress ring
      const progress = xp / 1500;
      const ringR = 38;

      ctx.beginPath();
      ctx.arc(cx, cy, ringR + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,210,130,0.08)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        ringR + 2,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress,
      );
      ctx.strokeStyle = G;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glowing arc tip
      const tipAngle = -Math.PI / 2 + Math.PI * 2 * progress;
      const tipX = cx + Math.cos(tipAngle) * (ringR + 2);
      const tipY = cy + Math.sin(tipAngle) * (ringR + 2);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,210,130,${0.2 + Math.sin(t * 3) * 0.1})`;
      ctx.fill();

      // Center badge
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = D;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,210,130,0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.fillStyle = "#555";
      ctx.font = "500 8px 'Space Grotesk', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("LEVEL", cx, cy - 8);
      ctx.fillStyle = G;
      ctx.font = "700 20px 'Space Grotesk', monospace";
      ctx.fillText(`0${level}`, cx, cy + 9);

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [xp, level]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", cursor: "crosshair" }}
    />
  );
};

// ─── STREAK HEATMAP ─────────────────────────────────────────
const StreakHeatmap: React.FC<{
  activityHistory: Record<string, number>;
}> = ({ activityHistory }) => {
  // Build 84 days (12 weeks) of real data
  const data = useMemo(() => {
    const maxXp = Math.max(
      1,
      ...Object.values(activityHistory).map((v) =>
        typeof v === "number" ? v : v ? 1 : 0,
      ),
    );
    return Array.from({ length: 84 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (83 - i));
      const key = date.toISOString().split("T")[0];
      const raw = activityHistory[key];
      const xp = typeof raw === "number" ? raw : raw ? 1 : 0;
      // Normalize to 0-5 scale based on max XP
      const level = xp === 0 ? 0 : Math.min(5, Math.ceil((xp / maxXp) * 5));
      return { xp, level };
    });
  }, [activityHistory]);

  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 12 }).map((_, w) => (
        <div
          key={w}
          style={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          {Array.from({ length: 7 }).map((_, d) => {
            const { xp, level } = data[w * 7 + d] || { xp: 0, level: 0 };
            const baseOpacity = level === 0 ? 1 : 0.15 + level * 0.17;
            return (
              <div
                key={d}
                title={`${xp} XP earned`}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background: level > 0 ? G : "var(--overlay-divider)",
                  opacity: baseOpacity,
                  transition: "transform 0.2s, opacity 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLDivElement).style.transform = "scale(1.5)";
                  (e.target as HTMLDivElement).style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLDivElement).style.transform = "scale(1)";
                  (e.target as HTMLDivElement).style.opacity =
                    String(baseOpacity);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ─── CREDENTIAL BADGE ───────────────────────────────────────
const CredBadge: React.FC<{
  name: string;
  xp: number;
  delay?: number;
}> = ({ name, xp, delay = 0 }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <TiltCard
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 14px",
        background: "rgba(0,210,130,0.03)",
        border: "1px solid rgba(0,210,130,0.08)",
        opacity: show ? 1 : 0,
        transform: show ? "none" : "translateY(12px)",
        transition: `all 0.6s ${SPRING}`,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          background: "rgba(0,210,130,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: G,
        }}
      >
        ✦
      </div>
      <div>
        <div
          style={{
            fontFamily: "'Space Grotesk'",
            fontSize: 11,
            fontWeight: 700,
            color: C,
          }}
        >
          {name}
        </div>
        <div style={{ fontFamily: "'Space Grotesk'", fontSize: 10, color: M }}>
          +{xp} XP
        </div>
      </div>
    </TiltCard>
  );
};

// ═════════════════════════════════════════════════════════════
//  DASHBOARD PAGE
// ═════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { user, connected } = useUser();
  const { progressMap } = useAllEnrollments();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Derive dashboard data from live sources
  const xp = user.xp;
  const level = calculateLevel(xp);
  const nextLevelXp = xpForLevel(level + 1);
  const xpRemaining = xpToNextLevel(xp);

  const completedCourses = useMemo(
    () => courses.filter((c) => progressMap[c.id]?.isComplete),
    [progressMap],
  );

  const inProgressCourses = useMemo(
    () =>
      courses.filter(
        (c) => progressMap[c.id]?.enrolled && !progressMap[c.id]?.isComplete,
      ),
    [progressMap],
  );

  const unenrolledCourses = useMemo(
    () => courses.filter((c) => !progressMap[c.id]?.enrolled),
    [progressMap],
  );

  // Current course = most recent in-progress course (or first enrolled)
  const currentCourse = inProgressCourses[0] ?? null;
  const currentProgress = currentCourse ? progressMap[currentCourse.id] : null;

  // Resume target: find the first incomplete lesson in current course
  const resumeTarget = useMemo(() => {
    if (!currentCourse || !currentProgress) return null;
    let lessonIdx = 0;
    for (const mod of currentCourse.modules) {
      for (const lesson of mod.lessons) {
        if (lessonIdx >= currentProgress.completed) {
          return {
            slug: currentCourse.slug,
            lessonId: lesson.id,
          };
        }
        lessonIdx++;
      }
    }
    return null;
  }, [currentCourse, currentProgress]);

  const handleResume = () => {
    if (resumeTarget) {
      router.push(
        `/${locale}/courses/${resumeTarget.slug}/lessons/${resumeTarget.lessonId}`,
      );
    }
  };

  const handleViewCerts = () => {
    router.push(`/${locale}/certificates`);
  };

  const enrolledCount = Object.values(progressMap).filter(
    (p) => p.enrolled,
  ).length;

  const credentials = user.credentials;
  const streakDays = user.streak.currentStreak;

  return (
    <div style={{ cursor: mobile ? "auto" : "none" }}>
      {!mobile && <CustomCursor />}
      <WalletGate>
        <div style={{ background: D, color: C, minHeight: "100vh" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "1fr" : "1fr 400px",
              minHeight: "100vh",
            }}
          >
            {/* ══ LEFT COLUMN ══ */}
            <div
              style={{
                padding: mobile ? "72px 20px 24px" : "80px 44px 40px",
                borderRight: mobile ? "none" : `1px solid ${BORDER}`,
              }}
            >
              {/* Welcome */}
              <Reveal>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11,
                    letterSpacing: 3,
                    color: M,
                    margin: "0 0 4px",
                  }}
                >
                  WELCOME BACK
                </p>
                <h2
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: mobile ? 40 : 56,
                    fontWeight: 400,
                    color: C,
                    margin: mobile ? "0 0 24px" : "0 0 36px",
                    lineHeight: 1,
                  }}
                >
                  Keep
                  <br />
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "var(--overlay-border)",
                    }}
                  >
                    building.
                  </span>
                </h2>
              </Reveal>

              {/* Stats grid */}
              <Reveal delay={100}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: mobile
                      ? "repeat(2, 1fr)"
                      : "repeat(4, 1fr)",
                    gap: 1,
                    background: BORDER,
                    marginBottom: 32,
                  }}
                >
                  {[
                    { v: xp, u: "XP", l: "EXPERIENCE" },
                    {
                      v: completedCourses.length,
                      u: `/${courses.length}`,
                      l: "COURSES",
                    },
                    { v: streakDays, u: "d", l: "STREAK" },
                    { v: level, u: "", l: "LEVEL" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{ background: D, padding: "20px 16px" }}
                    >
                      <div
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: 30,
                          color: C,
                        }}
                      >
                        <AnimCounter to={s.v} />
                        <span style={{ fontSize: 13, color: M }}>{s.u}</span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 9,
                          letterSpacing: 2,
                          color: M,
                          marginTop: 4,
                        }}
                      >
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Current course card */}
              <Reveal delay={200}>
                {currentCourse && currentProgress ? (
                  <TiltCard
                    style={{
                      background: "linear-gradient(135deg, #1a1040, #0d0a25)",
                      padding: 28,
                      marginBottom: 28,
                      position: "relative",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                    onClick={handleResume}
                  >
                    <span
                      style={{
                        position: "absolute",
                        right: -10,
                        top: -30,
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: 180,
                        color: "var(--c-text-faint)",
                      }}
                    >
                      {String(courses.indexOf(currentCourse) + 1).padStart(
                        2,
                        "0",
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      <div>
                        <div
                          style={{ display: "flex", gap: 6, marginBottom: 10 }}
                        >
                          {[
                            TRACK_LABELS[currentCourse.track].toUpperCase(),
                            currentCourse.difficulty.toUpperCase(),
                          ].map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: 9,
                                letterSpacing: 1.5,
                                padding: "3px 8px",
                                border: "1px solid var(--overlay-border)",
                                color: "var(--c-text-dim)",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Instrument Serif', serif",
                            fontSize: 26,
                            fontWeight: 400,
                            color: C,
                            margin: "0 0 4px",
                          }}
                        >
                          {currentCourse.title}
                        </h3>
                        <p
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 12,
                            color: "var(--c-text-dim)",
                            margin: 0,
                          }}
                        >
                          {currentCourse.description.slice(0, 80)}...
                        </p>
                      </div>
                      <Ring
                        pct={currentProgress.percent}
                        label={`${currentProgress.percent}%`}
                      />
                    </div>
                    <div style={{ marginTop: 24 }}>
                      <div
                        style={{
                          width: "100%",
                          height: 2,
                          background: "var(--overlay-divider)",
                        }}
                      >
                        <div
                          style={{
                            width: `${currentProgress.percent}%`,
                            height: "100%",
                            background: G,
                            transition: `width 2s ${SPRING}`,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 10,
                          letterSpacing: 1,
                          color: "var(--c-text-faint)",
                        }}
                      >
                        <span>
                          LESSON {currentProgress.completed} OF{" "}
                          {currentProgress.total}
                        </span>
                        <span
                          onClick={handleResume}
                          style={{ cursor: "pointer", color: G }}
                        >
                          CONTINUE →
                        </span>
                      </div>
                    </div>
                  </TiltCard>
                ) : completedCourses.length > 0 ? (
                  <div
                    style={{
                      padding: 28,
                      marginBottom: 28,
                      border: `1px solid ${BORDER}`,
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 12,
                        color: M,
                      }}
                    >
                      All enrolled courses completed! Browse more courses to
                      continue learning.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 28,
                      marginBottom: 28,
                      border: `1px solid ${BORDER}`,
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 12,
                        color: M,
                      }}
                    >
                      No courses in progress. Enroll in a course to get started!
                    </p>
                    <span
                      onClick={() => router.push(`/${locale}/courses`)}
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 10,
                        letterSpacing: 2,
                        color: G,
                        cursor: "pointer",
                        marginTop: 8,
                        display: "inline-block",
                      }}
                    >
                      BROWSE COURSES →
                    </span>
                  </div>
                )}
              </Reveal>

              {/* Earned credentials */}
              <Reveal delay={300}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    letterSpacing: 2,
                    color: M,
                    margin: "0 0 14px",
                  }}
                >
                  EARNED CREDENTIALS
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginBottom: 32,
                  }}
                >
                  {credentials.length > 0 ? (
                    credentials.map((cred, i) => (
                      <CredBadge
                        key={cred.id}
                        name={`${TRACK_LABELS[cred.track]} Credential`}
                        xp={cred.xpEarned}
                        delay={600 + i * 200}
                      />
                    ))
                  ) : (
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 12,
                        color: M,
                      }}
                    >
                      Complete courses to earn credentials.
                    </p>
                  )}
                </div>
              </Reveal>

              {/* Up Next */}
              <Reveal delay={400}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    letterSpacing: 2,
                    color: M,
                    margin: "0 0 12px",
                  }}
                >
                  UP NEXT
                </p>
                {unenrolledCourses.length > 0 ? (
                  unenrolledCourses.slice(0, 3).map((c, i) => (
                    <div
                      key={c.id}
                      data-magnetic
                      onClick={() =>
                        router.push(`/${locale}/courses/${c.slug}`)
                      }
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 0",
                        borderBottom: `1px solid ${BORDER}`,
                        cursor: "pointer",
                        transition: "padding-left 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.paddingLeft =
                          "12px";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.paddingLeft =
                          "0px";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Instrument Serif', serif",
                            fontSize: 22,
                            color: "var(--overlay-border)",
                            fontStyle: "italic",
                            width: 24,
                          }}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <div
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: 14,
                              fontWeight: 500,
                              color: C,
                            }}
                          >
                            {c.title}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontSize: 10,
                              color: M,
                              letterSpacing: 1,
                            }}
                          >
                            {c.lessonCount} LESSONS · {c.xpReward} XP
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 9,
                          letterSpacing: 1.5,
                          padding: "4px 10px",
                          border: `1px solid ${BORDER}`,
                          color: M,
                        }}
                      >
                        {TRACK_LABELS[c.track].toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      color: M,
                      padding: "14px 0",
                    }}
                  >
                    You&apos;ve enrolled in all available courses!
                  </p>
                )}
              </Reveal>
            </div>

            {/* ══ RIGHT COLUMN ══ */}
            <div
              style={{
                padding: mobile ? "24px 20px" : "80px 28px 40px",
                display: "flex",
                flexDirection: "column",
                gap: mobile ? 20 : 28,
              }}
            >
              {/* Seasonal Event Banner */}
              <SeasonalEventBanner />

              {/* XP Orbital */}
              <Reveal delay={200}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    letterSpacing: 2,
                    color: M,
                    margin: "0 0 8px",
                  }}
                >
                  XP ORBIT · HOVER TO INTERACT
                </p>
                <div
                  style={{
                    width: "100%",
                    height: mobile ? 260 : 340,
                    background: "var(--overlay-divider)",
                    border: `1px solid ${BORDER}`,
                    position: "relative",
                  }}
                >
                  <OrbitalXP xp={xp} level={level} />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: 14,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: 26,
                        color: G,
                      }}
                    >
                      {xp.toLocaleString()}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 10,
                        letterSpacing: 2,
                        color: "var(--c-text-faint)",
                      }}
                    >
                      / {nextLevelXp.toLocaleString()} XP
                    </span>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      right: 14,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 9,
                      letterSpacing: 1,
                      color: "var(--c-text-faint)",
                    }}
                  >
                    {xpRemaining.toLocaleString()} XP TO LVL{" "}
                    {String(level + 1).padStart(2, "0")}
                  </div>
                </div>
              </Reveal>

              {/* Streak Heatmap */}
              <Reveal delay={350}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10,
                      letterSpacing: 2,
                      color: M,
                      margin: 0,
                    }}
                  >
                    LEARNING STREAK
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: G,
                        animation: "stPulse 2s ease-in-out infinite",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: C,
                      }}
                    >
                      {streakDays} DAYS
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: mobile ? 14 : 20,
                    border: `1px solid ${BORDER}`,
                    background: "var(--overlay-divider)",
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <StreakHeatmap
                    activityHistory={user.streak.activityHistory}
                  />
                </div>
              </Reveal>

              {/* Mini Leaderboard */}
              <Reveal delay={500}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    letterSpacing: 2,
                    color: M,
                    margin: "0 0 12px",
                  }}
                >
                  YOUR STATS
                </p>
                <div style={{ border: `1px solid ${BORDER}` }}>
                  {[
                    { label: "LEVEL", value: `${level}` },
                    {
                      label: "ENROLLED",
                      value: `${enrolledCount} courses`,
                    },
                    {
                      label: "COMPLETED",
                      value: `${completedCourses.length} courses`,
                    },
                    {
                      label: "CREDENTIALS",
                      value: `${credentials.length}`,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom: i < 3 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                          color: M,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: C,
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Quick actions */}
              <Reveal delay={650}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <button
                    data-magnetic
                    onClick={handleResume}
                    disabled={!resumeTarget}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      padding: "18px 16px",
                      background: resumeTarget ? C : "var(--overlay-divider)",
                      color: resumeTarget ? D : M,
                      border: "none",
                      cursor: resumeTarget ? "pointer" : "default",
                      transition: "all 0.3s",
                      opacity: resumeTarget ? 1 : 0.5,
                    }}
                    onMouseEnter={(e) => {
                      if (resumeTarget) {
                        (e.target as HTMLButtonElement).style.background = G;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (resumeTarget) {
                        (e.target as HTMLButtonElement).style.background = C;
                      }
                    }}
                  >
                    {resumeTarget ? "RESUME →" : "NO COURSE"}
                  </button>
                  <button
                    data-magnetic
                    onClick={handleViewCerts}
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 2,
                      padding: "18px 16px",
                      background: "transparent",
                      color: C,
                      border: `1px solid ${BORDER}`,
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.borderColor =
                        "var(--c-text-faint)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.borderColor =
                        BORDER;
                    }}
                  >
                    VIEW CERTS
                  </button>
                </div>
              </Reveal>

              {/* Daily Challenges */}
              <Reveal delay={750}>
                <DailyChallenges />
              </Reveal>
            </div>
          </div>

          {/* Keyframes */}
          <style>{`
          @keyframes stPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
        </div>
      </WalletGate>
    </div>
  );
}
