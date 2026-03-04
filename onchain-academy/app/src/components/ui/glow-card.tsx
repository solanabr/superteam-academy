"use client";

import { useRef, useState, ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

export function GlowCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  function handleMove(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        "group relative rounded-2xl border border-white/[0.06] bg-surface p-6 overflow-hidden transition-all duration-500 hover:border-white/[0.12] hover:-translate-y-1",
        className,
      )}
    >
      {/* Mouse-following radial glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(124,92,252,0.12), rgba(20,241,149,0.06), transparent 50%)`,
        }}
      />
      {/* Border glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(124,92,252,0.25), transparent 50%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
