"use client";

import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
//  Design tokens — theme-aware via CSS variables
// ═══════════════════════════════════════════════════════════════════════
export const G = "var(--nd-highlight-green)";
export const D = "var(--background)";
export const C = "var(--foreground)";
export const M = "var(--c-text-muted)";

const FONT_SANS = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
const FONT_SERIF = "var(--font-instrument-serif), 'Instrument Serif', serif";

// ─── CUSTOM CURSOR ──────────────────────────────────────────
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const scale = useRef(1);
  const targetScale = useRef(1);
  const hasSnapped = useRef(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(hover: none)").matches ||
      "ontouchstart" in window
    ) {
      setIsTouch(true);
      return;
    }
    const move = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!hasSnapped.current) {
        hasSnapped.current = true;
        pos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest("[data-magnetic]") ||
        el.closest("button") ||
        el.closest("a")
      ) {
        targetScale.current = 2.5;
      } else if (el.closest("canvas")) {
        targetScale.current = 0.5;
      } else {
        targetScale.current = 1;
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);

    let raf: number;
    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12;
      pos.current.y += (target.current.y - pos.current.y) * 0.12;
      scale.current += (targetScale.current - scale.current) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px) scale(${scale.current})`;
      }
      raf = requestAnimationFrame(tick);
    };
    // First tick positions elements at (-104, -104) — off-screen
    tick();
    // Safe to make visible now: elements are off-screen, no flash
    if (dotRef.current) dotRef.current.style.visibility = "visible";
    if (ringRef.current) ringRef.current.style.visibility = "visible";

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          background: G,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
          transition: "width 0.2s, height 0.2s",
          visibility: "hidden",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          border: `1px solid ${G}`,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0.5,
          mixBlendMode: "difference",
          visibility: "hidden",
        }}
      />
    </>
  );
}

// ─── CONSTELLATION CANVAS ───────────────────────────────────
export function ConstellationCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    let w: number, h: number;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      mouse.current = { x: -999, y: -999 };
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    const nodes = Array.from({ length: 140 }, () => ({
      x: Math.random() * 1600,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 2,
      baseA: 0.15 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;

        const dx = mouse.current.x - n.x;
        const dy = mouse.current.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250 && dist > 0) {
          const force = ((250 - dist) / 250) * 0.04;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
        n.vx *= 0.995;
        n.vy *= 0.995;

        const a = n.baseA + Math.sin(n.pulse) * 0.1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 210, 130, ${a})`;
        ctx.fill();

        if (n.r > 2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 210, 130, ${a * 0.06})`;
          ctx.fill();
        }
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const a = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 210, 130, ${a})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (mouse.current.x > 0) {
        const grd = ctx.createRadialGradient(
          mouse.current.x,
          mouse.current.y,
          0,
          mouse.current.x,
          mouse.current.y,
          180,
        );
        grd.addColorStop(0, "rgba(0, 210, 130, 0.04)");
        grd.addColorStop(1, "rgba(0, 210, 130, 0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}

// ─── CHARACTER-BY-CHARACTER TEXT REVEAL (CSS-only for fast LCP) ──
// Uses fill-mode "both" so text is visible in SSR (natural state),
// then animation replays the reveal. LCP fires on first paint (visible).
export function CharReveal({
  text,
  delay = 0,
  style = {},
  italic = false,
  color,
}: {
  text: string;
  delay?: number;
  style?: React.CSSProperties;
  italic?: boolean;
  color?: string;
}) {
  return (
    <span style={{ display: "inline-block", overflow: "hidden", ...style }}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            fontStyle: italic ? "italic" : "normal",
            color: color || "inherit",
            animation: `char-reveal-in-delayed 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * 25}ms both`,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}

// ─── GLITCH TEXT ─────────────────────────────────────────────
export function GlitchText({ children }: { children: React.ReactNode }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(
      () => {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      },
      4000 + Math.random() * 3000,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {glitch && (
        <>
          <span
            style={{
              position: "absolute",
              top: "-2px",
              left: "2px",
              color: "#ff0040",
              opacity: 0.7,
              clipPath: "inset(10% 0 60% 0)",
              zIndex: 1,
            }}
          >
            {children}
          </span>
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: "-2px",
              color: "#00ffaa",
              opacity: 0.7,
              clipPath: "inset(50% 0 10% 0)",
              zIndex: 1,
            }}
          >
            {children}
          </span>
        </>
      )}
    </span>
  );
}

// ─── 3D TILT CARD ───────────────────────────────────────────
export function TiltCard({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
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
    const rotY = (x - 0.5) * 16;
    const rotX = (0.5 - y) * 16;
    setTransform(
      `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`,
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
      style={{
        transform,
        transition: "transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
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
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          transition: "background 0.3s",
        }}
      />
    </div>
  );
}

// ─── MAGNETIC BUTTON ────────────────────────────────────────
export function MagneticBtn({
  children,
  primary = false,
  onClick,
  href,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 });
  };

  const baseStyle: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition:
      "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s, color 0.3s, border-color 0.3s",
    fontFamily: FONT_SANS,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "2.5px",
    textTransform: "uppercase",
    padding: "20px 44px",
    background: primary ? C : "transparent",
    color: primary ? D : C,
    border: primary ? "none" : "1px solid var(--overlay-border)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    textDecoration: "none",
    display: "inline-block",
  };

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        data-magnetic
        onMouseMove={handleMove}
        onMouseLeave={() => setOffset({ x: 0, y: 0 })}
        style={baseStyle}
      >
        <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
      </a>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      data-magnetic
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={onClick}
      style={baseStyle}
    >
      <span style={{ position: "relative", zIndex: 2 }}>{children}</span>
    </button>
  );
}

// ─── SCROLL REVEAL ──────────────────────────────────────────
export function Reveal({
  children,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}) {
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

  const transforms = {
    up: "translateY(60px)",
    down: "translateY(-60px)",
    left: "translateX(60px)",
    right: "translateX(-60px)",
  };

  return (
    <div
      ref={ref}
      style={{
        transform: visible ? "none" : transforms[direction],
        opacity: visible ? 1 : 0,
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}

// ─── ANIMATED COUNTER ───────────────────────────────────────
export function Counter({
  to,
  duration = 2200,
  suffix = "",
}: {
  to: number;
  duration?: number;
  suffix?: string;
}) {
  const [v, setV] = useState(0);
  const rafRef = useRef<number>(0);
  const started = useRef(false);
  const divRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
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
}

// ─── PROGRESS RING (SVG) ───────────────────────────────────
export function Ring({
  pct,
  size = 64,
  strokeW = 3,
  label,
}: {
  pct: number;
  size?: number;
  strokeW?: number;
  label: string;
}) {
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
          style={{
            transition: "stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_SANS,
          fontSize: "13px",
          fontWeight: 700,
          color: C,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── XP ORBITAL CANVAS ─────────────────────────────────────
export function OrbitalXP({
  xp = 960,
  level = 3,
  maxXp = 1500,
}: {
  xp?: number;
  level?: number;
  maxXp?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const canvas = ref.current;
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

      const amb = ctx.createRadialGradient(cx, cy, 20, cx, cy, 170);
      amb.addColorStop(
        0,
        `rgba(0, 210, 130, ${0.04 + Math.sin(t * 0.5) * 0.02})`,
      );
      amb.addColorStop(1, "rgba(0, 210, 130, 0)");
      ctx.fillStyle = amb;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fill();

      [65, 100, 140].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 210, 130, ${0.03 + Math.sin(t * 0.3 + i) * 0.015})`;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      particles.forEach((p) => {
        p.angle += p.speed * (1 + p.layer * 0.3);
        p.wobble += p.wobbleSpd;

        const wx = Math.sin(p.wobble) * p.wobbleAmp;
        const wy = Math.cos(p.wobble * 0.7) * p.wobbleAmp * 0.5;
        let x = cx + Math.cos(p.angle) * p.orbit + wx;
        let y = cy + Math.sin(p.angle) * p.orbit + wy;

        const dx = x - mouse.current.x,
          dy = y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const f = ((80 - dist) / 80) * 12;
          x += (dx / dist) * f;
          y += (dy / dist) * f;
        }

        p.trail.push({ x, y });
        if (p.trail.length > 8) p.trail.shift();

        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = (i / p.trail.length) * p.brightness * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
          ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${a})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        const pulse = 1 + Math.sin(t * 2.5 + p.angle * 3) * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.brightness * 0.85})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.brightness * 0.05})`;
        ctx.fill();
      });

      const progress = xp / maxXp;
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

      const tipAngle = -Math.PI / 2 + Math.PI * 2 * progress;
      const tipX = cx + Math.cos(tipAngle) * (ringR + 2);
      const tipY = cy + Math.sin(tipAngle) * (ringR + 2);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 210, 130, ${0.2 + Math.sin(t * 3) * 0.1})`;
      ctx.fill();

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
      ctx.fillText(String(level).padStart(2, "0"), cx, cy + 9);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [xp, level, maxXp]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: "100%", cursor: "crosshair" }}
    />
  );
}

// ─── STREAK HEATMAP (dark theme) ────────────────────────────
export function DarkHeatmap({
  activityHistory,
}: {
  activityHistory: Record<string, number>;
}) {
  const values = Object.values(activityHistory).filter(
    (v) => typeof v === "number" && v > 0,
  );
  const maxXp = Math.max(1, ...values);
  const days = Array.from({ length: 84 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (83 - i));
    const key = date.toISOString().split("T")[0];
    const raw = activityHistory[key];
    const xp = typeof raw === "number" ? raw : raw ? 1 : 0;
    return xp === 0 ? 0 : Math.min(5, Math.ceil((xp / maxXp) * 5));
  });

  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: 12 }).map((_, w) => (
        <div
          key={w}
          style={{ display: "flex", flexDirection: "column", gap: "3px" }}
        >
          {Array.from({ length: 7 }).map((_, d) => {
            const v = days[w * 7 + d] || 0;
            return (
              <div
                key={d}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 2,
                  background: v > 0 ? G : "var(--overlay-divider)",
                  opacity: v === 0 ? 1 : 0.15 + v * 0.17,
                  transition: "transform 0.2s, opacity 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.5)";
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.opacity =
                    v === 0 ? "1" : String(0.15 + v * 0.17);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── FONT HELPERS (exported for pages) ──────────────────────
export { FONT_SANS, FONT_SERIF };
