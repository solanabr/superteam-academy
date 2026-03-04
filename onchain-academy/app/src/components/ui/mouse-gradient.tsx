"use client";

import { useRef, useState, MouseEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function MouseGradient({ children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  function handleMove(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  }

  return (
    <div ref={ref} onMouseMove={handleMove} className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${pos.x}% ${pos.y}%, rgba(124,92,252,0.12), rgba(20,241,149,0.04), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
