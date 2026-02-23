"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface SkillConstellationProps {
  skills: Record<string, number>;
  className?: string;
}

const TRACK_COLORS: Record<string, string> = {
  rust: "#F48252",
  anchor: "#CA9FF5",
  frontend: "#6693F7",
  security: "#EF4444",
  defi: "#55E9AB",
  mobile: "#EC4899",
};

const TRACK_LABELS: Record<string, string> = {
  rust: "Rust",
  anchor: "Anchor",
  frontend: "Frontend",
  security: "Security",
  defi: "DeFi",
  mobile: "Mobile",
};

const TRACK_ORDER = [
  "rust",
  "anchor",
  "frontend",
  "security",
  "defi",
  "mobile",
];

const HUB_COLOR = "#00FFA3";
const CONNECTION_COLOR = "rgba(85, 233, 171, 0.15)";
const MIN_NODE_RADIUS = 8;
const MAX_NODE_RADIUS = 28;
const HOVER_DISTANCE = 50;

interface NodeData {
  key: string;
  label: string;
  color: string;
  level: number;
  baseRadius: number;
  x: number;
  y: number;
  phase: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function SkillConstellation({
  skills,
  className,
}: SkillConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<NodeData[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const buildNodes = useCallback(
    (width: number, height: number): NodeData[] => {
      const cx = width / 2;
      const cy = height / 2;
      const orbitRadius = Math.min(width, height) * 0.32;

      const hubNode: NodeData = {
        key: "solana",
        label: "Solana",
        color: HUB_COLOR,
        level: 100,
        baseRadius: 18,
        x: cx,
        y: cy,
        phase: 0,
      };

      const skillNodes: NodeData[] = TRACK_ORDER.map((key, i) => {
        const angle = (Math.PI * 2 * i) / TRACK_ORDER.length - Math.PI / 2;
        const level = Math.max(0, Math.min(100, skills[key] ?? 0));
        const radius = lerp(MIN_NODE_RADIUS, MAX_NODE_RADIUS, level / 100);

        return {
          key,
          label: TRACK_LABELS[key] ?? key,
          color: TRACK_COLORS[key] ?? "#FFFFFF",
          level,
          baseRadius: radius,
          x: cx + Math.cos(angle) * orbitRadius,
          y: cy + Math.sin(angle) * orbitRadius,
          phase: (i * Math.PI * 2) / TRACK_ORDER.length,
        };
      });

      return [hubNode, ...skillNodes];
    },
    [skills],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;
    nodesRef.current = buildNodes(dimensions.width, dimensions.height);
  }, [dimensions, buildNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const render = (time: number) => {
      const w = dimensions.width;
      const h = dimensions.height;
      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Background with radial gradient
      const bgGrad = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.6,
      );
      bgGrad.addColorStop(0, "#0a0f0a");
      bgGrad.addColorStop(1, "#000000");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (nodes.length === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const hub = nodes[0];
      const skillNodes = nodes.slice(1);
      const t = time * 0.001;

      // Compute animated positions and hover state
      const animated = nodes.map((node) => {
        const pulse = 1 + Math.sin(t * 1.5 + node.phase) * 0.025;
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hovered = dist < HOVER_DISTANCE;
        const hoverScale = hovered ? 1.2 : 1;
        const hoverGlow = hovered ? 1.0 : 0.0;
        const radius = node.baseRadius * pulse * hoverScale;

        return { ...node, radius, hovered, hoverGlow, dist };
      });

      const animHub = animated[0];
      const animSkills = animated.slice(1);

      // Draw connections: hub to each skill node
      ctx.lineWidth = 0.8;
      for (const node of animSkills) {
        ctx.beginPath();
        ctx.moveTo(animHub.x, animHub.y);
        ctx.lineTo(node.x, node.y);

        const lineGrad = ctx.createLinearGradient(
          animHub.x,
          animHub.y,
          node.x,
          node.y,
        );
        lineGrad.addColorStop(0, "rgba(0, 255, 163, 0.2)");
        lineGrad.addColorStop(1, CONNECTION_COLOR);
        ctx.strokeStyle = lineGrad;
        ctx.stroke();
      }

      // Draw hexagon outline (adjacent connections)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = CONNECTION_COLOR;
      for (let i = 0; i < animSkills.length; i++) {
        const a = animSkills[i];
        const b = animSkills[(i + 1) % animSkills.length];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Draw node glows
      for (const node of animated) {
        const glowRadius = node.radius * (node.hovered ? 4.5 : 3);
        const { r, g, b } = hexToRgb(node.color);
        const glowAlpha = node.hovered ? 0.35 : 0.12;
        const glowGrad = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius,
        );
        glowGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowAlpha})`);
        glowGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw node circles
      for (const node of animated) {
        // Outer ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        const { r, g, b } = hexToRgb(node.color);
        const fillAlpha = node.hovered ? 0.4 : 0.2;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fillAlpha})`;
        ctx.fill();

        ctx.lineWidth = node.hovered ? 2 : 1.2;
        ctx.strokeStyle = node.color;
        ctx.stroke();

        // Inner bright dot
        const innerR = Math.max(2, node.radius * 0.3);
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerR, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
      }

      // Draw labels
      ctx.textAlign = "center";

      for (const node of animated) {
        const isHub = node.key === "solana";
        const labelY = node.y + node.radius + 16;

        // Skill name
        ctx.font = "11px monospace";
        ctx.fillStyle = node.hovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.65)";
        ctx.fillText(node.label, node.x, labelY);

        // Level percentage (skip for hub)
        if (!isHub) {
          const pctY = node.hovered ? node.y - node.radius - 8 : labelY + 13;
          ctx.font = node.hovered ? "bold 13px monospace" : "10px monospace";
          ctx.fillStyle = node.color;
          ctx.fillText(`${node.level}%`, node.x, pctY);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [dimensions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[350px] rounded-[2px] border border-[var(--c-border-subtle)] overflow-hidden bg-black",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
