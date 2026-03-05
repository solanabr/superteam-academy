import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

export function ProgressBar({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary/20",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out glow-bg shadow-[0_0_10px_rgba(52,211,153,0.5)]",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - (safeValue || 0)}%)` }}
      />
    </div>
  );
}
