"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { formatNumber } from "@/lib/format";
import { Reveal } from "./dashboard-primitives";
import { G, D, C, BORDER, SPRING } from "./dashboard-primitives";

const OrbitalXP: React.FC<{
  xp?: number;
  level?: number;
}> = ({ xp = 960, level = 3 }) => {
  const locale = useLocale();
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

      const amb = ctx.createRadialGradient(cx, cy, 20, cx, cy, 170);
      amb.addColorStop(0, `rgba(0,210,130,${0.04 + Math.sin(t * 0.5) * 0.02})`);
      amb.addColorStop(1, "rgba(0,210,130,0)");
      ctx.fillStyle = amb;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fill();

      [65, 100, 140].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,210,130,${0.03 + Math.sin(t * 0.3 + i) * 0.015})`;
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

        for (let i = 0; i < p.trail.length - 1; i++) {
          const a = (i / p.trail.length) * p.brightness * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.trail[i].x, p.trail[i].y);
          ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
          ctx.strokeStyle = `hsla(${p.hue},80%,60%,${a})`;
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        const pulse = 1 + Math.sin(t * 2.5 + p.angle * 3) * 0.25;
        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},85%,65%,${p.brightness * 0.85})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, p.size * pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.brightness * 0.05})`;
        ctx.fill();
      });

      const progress = xp / 1500;
      const ringR = 38;

      ctx.beginPath();
      ctx.arc(cx, cy, ringR + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,210,130,0.08)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, ringR + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = G;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      const tipAngle = -Math.PI / 2 + Math.PI * 2 * progress;
      const tipX = cx + Math.cos(tipAngle) * (ringR + 2);
      const tipY = cy + Math.sin(tipAngle) * (ringR + 2);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,210,130,${0.2 + Math.sin(t * 3) * 0.1})`;
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

      ctx.fillStyle = "#999";
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

export const DashboardXP: React.FC<{
  xp: number;
  level: number;
  nextLevelXp: number;
  xpRemaining: number;
}> = ({ xp, level, nextLevelXp, xpRemaining }) => {
  const locale = useLocale();
  return (
  <Reveal delay={200}>
    <p
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 10,
        letterSpacing: 2,
        color: "var(--c-text-muted)",
        margin: "0 0 8px",
      }}
    >
      XP ORBIT · HOVER TO INTERACT
    </p>
    <div
      className="dash-xp-canvas"
      style={{
        width: "100%",
        background: "var(--overlay-divider)",
        border: `1px solid ${BORDER}`,
        position: "relative",
        contain: "layout",
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
          {formatNumber(xp, locale)}
        </span>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10,
            letterSpacing: 2,
            color: "var(--c-text-dim)",
          }}
        >
          / {formatNumber(nextLevelXp, locale)} XP
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
          color: "var(--c-text-dim)",
        }}
      >
        {formatNumber(xpRemaining, locale)} XP TO LVL{" "}
        {String(level + 1).padStart(2, "0")}
      </div>
    </div>
  </Reveal>
  );
};
