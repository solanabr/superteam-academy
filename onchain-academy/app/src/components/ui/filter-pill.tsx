"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function FilterPill({
  active,
  onClick,
  children,
  className,
}: FilterPillProps) {
  return (
    <button
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center px-3 py-1.5 rounded-[1px] text-[11px] font-mono font-medium uppercase tracking-wider border transition-all whitespace-nowrap",
        active
          ? "bg-[#00FFA3]/10 border-[#00FFA3]/50 text-[#00FFA3] shadow-[0_0_8px_-2px_rgba(0,255,163,0.2)]"
          : "border-[var(--c-border-subtle)] bg-[var(--c-bg-card)] text-[var(--c-text-2)] hover:border-[var(--c-border-prominent)] hover:text-[var(--c-text)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function FilterPillGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>
  );
}
