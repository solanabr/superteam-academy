"use client";

import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseOpacity: number;
  opacity: number;
}

const PARTICLE_COUNT = 70;
const CONNECTION_DIST = 120;
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
const MOUSE_RADIUS = 180;
const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
const BASE_SPEED = 0.3;
const EDGE_MARGIN = 5;

function createParticle(width: number, height: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = BASE_SPEED * (0.3 + Math.random() * 0.7);
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 1 + Math.random() * 1,
    baseOpacity: 0.15 + Math.random() * 0.35,
    opacity: 0,
  };
}

export function AnimatedGrid({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const dimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.active = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimensionsRef.current = { w, h };

      const particles = particlesRef.current;
      if (particles.length === 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push(createParticle(w, h));
        }
      } else {
        for (const p of particles) {
          if (p.x > w) p.x = w - EDGE_MARGIN;
          if (p.y > h) p.y = h - EDGE_MARGIN;
        }
      }
    };

    const animate = () => {
      const { w, h } = dimensionsRef.current;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update positions
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Subtle random drift
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > BASE_SPEED * 1.5) {
          const scale = (BASE_SPEED * 1.5) / speed;
          p.vx *= scale;
          p.vy *= scale;
        }
        if (speed < BASE_SPEED * 0.2) {
          const scale = (BASE_SPEED * 0.2) / speed;
          p.vx *= scale;
          p.vy *= scale;
        }

        // Bounce off edges
        if (p.x < EDGE_MARGIN) {
          p.x = EDGE_MARGIN;
          p.vx = Math.abs(p.vx) * 0.8;
        } else if (p.x > w - EDGE_MARGIN) {
          p.x = w - EDGE_MARGIN;
          p.vx = -Math.abs(p.vx) * 0.8;
        }
        if (p.y < EDGE_MARGIN) {
          p.y = EDGE_MARGIN;
          p.vy = Math.abs(p.vy) * 0.8;
        } else if (p.y > h - EDGE_MARGIN) {
          p.y = h - EDGE_MARGIN;
          p.vy = -Math.abs(p.vy) * 0.8;
        }

        // Compute mouse proximity influence on opacity
        let mouseInfluence = 0;
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const mdSq = mdx * mdx + mdy * mdy;
          if (mdSq < MOUSE_RADIUS_SQ) {
            mouseInfluence = 1 - Math.sqrt(mdSq) / MOUSE_RADIUS;
          }
        }

        const targetOpacity = p.baseOpacity + mouseInfluence * 0.5;
        p.opacity += (targetOpacity - p.opacity) * 0.08;
      }

      // Draw connections (distance-squared check first for performance)
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;

          if (distSq > CONNECTION_DIST_SQ) continue;

          const dist = Math.sqrt(distSq);
          const lineOpacity = 1 - dist / CONNECTION_DIST;

          // Check if midpoint is near mouse
          let nearMouse = false;
          if (mouse.active) {
            const mx = (a.x + b.x) * 0.5 - mouse.x;
            const my = (a.y + b.y) * 0.5 - mouse.y;
            nearMouse = mx * mx + my * my < MOUSE_RADIUS_SQ;
          }

          if (nearMouse) {
            ctx.strokeStyle = `rgba(0, 255, 163, ${lineOpacity * 0.15})`;
          } else {
            ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity * 0.03})`;
          }

          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 163, ${p.opacity})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Listen on document so we don't block any page interactions
    document.addEventListener("mousemove", handleMouseMove);

    resize();
    animationRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className ?? ""}`}
      style={{ width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}

export const ParticleNetwork = AnimatedGrid;
