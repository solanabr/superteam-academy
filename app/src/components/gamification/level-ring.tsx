"use client";

import { cn } from "@/lib/utils";
import { xpProgress } from "@/lib/constants";

interface LevelRingProps {
  xp: number;
  size?: number;
  className?: string;
}

export function LevelRing({ xp, size = 64, className }: LevelRingProps) {
  const { level, progress } = xpProgress(xp);
  const strokeWidth = size >= 80 ? 4 : 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold leading-none"
          style={{ fontSize: size * 0.3 }}
        >
          {level}
        </span>
        <span
          className="text-muted-foreground leading-none"
          style={{ fontSize: size * 0.15 }}
        >
          LVL
        </span>
      </div>
    </div>
  );
}
