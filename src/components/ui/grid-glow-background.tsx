"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GridGlowBackgroundProps {
  children: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  gridColor?: string;
  gridSize?: number;
  glowColors?: string[];
  glowCount?: number;
}

type GlowPoint = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  speed: number;
  color: string;
  alpha: number;
};

export function GridGlowBackground({
  children,
  className,
  backgroundColor = "var(--bg-base)",
  gridColor = "rgba(255, 255, 255, 0.05)",
  gridSize = 56,
  glowColors = [
    "rgba(153,69,255,0.9)",
    "rgba(67,180,202,0.85)",
    "rgba(25,251,155,0.85)",
    "rgba(255,210,63,0.65)",
    "rgba(0,140,76,0.7)",
  ],
  glowCount = 12,
}: GridGlowBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let frameId = 0;
    let glows: GlowPoint[] = [];

    const snap = (value: number) => Math.floor(value / gridSize) * gridSize;
    const randomColor = () =>
      glowColors[Math.floor(Math.random() * glowColors.length)] ?? glowColors[0];

    const createGlow = (): GlowPoint => {
      const x = snap(Math.random() * Math.max(width, gridSize));
      const y = snap(Math.random() * Math.max(height, gridSize));
      return {
        x,
        y,
        targetX: x,
        targetY: y,
        radius: Math.random() * 120 + 90,
        speed: Math.random() * 0.015 + 0.01,
        color: randomColor(),
        alpha: reduceMotion ? 0.7 : 0,
      };
    };

    const setNewTarget = (glow: GlowPoint) => {
      glow.targetX = snap(Math.random() * Math.max(width, gridSize));
      glow.targetY = snap(Math.random() * Math.max(height, gridSize));
    };

    const resize = () => {
      width = Math.max(container.clientWidth, 1);
      height = Math.max(container.clientHeight, 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glows = Array.from({ length: glowCount }, () => createGlow());
      glows.forEach(setNewTarget);
    };

    const drawGrid = () => {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawGlow = (glow: GlowPoint) => {
      const gradient = ctx.createRadialGradient(
        glow.x,
        glow.y,
        0,
        glow.x,
        glow.y,
        glow.radius,
      );
      gradient.addColorStop(0, glow.color);
      gradient.addColorStop(1, "transparent");

      ctx.save();
      ctx.globalAlpha = glow.alpha;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(glow.x, glow.y, glow.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      drawGrid();

      for (const glow of glows) {
        if (!reduceMotion) {
          glow.x += (glow.targetX - glow.x) * glow.speed;
          glow.y += (glow.targetY - glow.y) * glow.speed;
          if (Math.abs(glow.targetX - glow.x) < 1 && Math.abs(glow.targetY - glow.y) < 1) {
            setNewTarget(glow);
          }
          if (glow.alpha < 0.85) glow.alpha += 0.01;
        }
        drawGlow(glow);
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    tick();

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [glowColors, glowCount, gridColor, gridSize]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-65"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default GridGlowBackground;
