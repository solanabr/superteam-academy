"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel,
}: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div
        className="h-1.5 w-full bg-[var(--c-border-subtle)] rounded-[1px] overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full bg-gradient-to-r from-[#00FFA3] to-[#03E1FF] rounded-[1px] transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-[var(--c-text-2)]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
