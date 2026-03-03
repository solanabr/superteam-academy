"use client";

import { GlowEffect } from "@/components/ui/glow-effect";

export function GlowButton({
  children,
  className,
  colors,
}: {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}) {
  return (
    <div className={`relative inline-flex rounded-lg ${className ?? ""}`}>
      <GlowEffect
        colors={colors ?? ["#34d399", "#059669", "#eab308", "#34d399"]}
        mode="rotate"
        blur="softest"
        duration={3}
        scale={1.04}
        className="rounded-lg"
      />
      {children}
    </div>
  );
}
