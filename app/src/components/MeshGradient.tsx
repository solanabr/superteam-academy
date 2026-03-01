"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  { r: 120, g: 80, b: 200 },
  { r: 80, g: 120, b: 220 },
  { r: 200, g: 100, b: 180 },
];

function setupCanvas(canvas: HTMLCanvasElement) {
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  return resize;
}

function createGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: { r: number; g: number; b: number },
  time: number,
  index: number
) {
  const r = color.r + Math.sin(time * 0.5 + index) * 20;
  const g = color.g + Math.cos(time * 0.4 + index) * 20;
  const b = color.b + Math.sin(time * 0.6 + index) * 20;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
  gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.1)`);
  gradient.addColorStop(1, "transparent");
  return gradient;
}

export function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    const resize = setupCanvas(canvas);

    window.addEventListener("resize", resize);

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const draw = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      time += 0.003;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#020204";
      ctx.fillRect(0, 0, w, h);

      COLORS.forEach((color, i) => {
        const angle = time * (0.5 + i * 0.2) + i * 1.5;
        const x = w * (0.3 + 0.4 * Math.sin(angle) + 0.2 * Math.sin(time * 0.3 + i));
        const y = h * (0.3 + 0.4 * Math.cos(angle * 0.7) + 0.2 * Math.cos(time * 0.4 + i));
        const size = Math.min(w, h) * 0.7 + Math.sin(time * 0.6 + i * 2) * 150;

        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = createGradient(ctx, x, y, size, color, time, i);
        ctx.fillRect(0, 0, w, h);
      });

      ctx.globalCompositeOperation = "source-over";
      const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [isVisible]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#020204]" />
      {isVisible && (
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      )}
      <div className="grain-overlay" style={{ zIndex: -1 }} />
    </>
  );
}
