"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<"div"> & {
  value?: number;
  max?: number;
};

function Progress({
  className,
  value = 0,
  max = 100,
  ...props
}: ProgressProps): React.ReactElement {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      data-value={value}
      data-state={percent >= 100 ? "complete" : "loading"}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-none border-2 border-border bg-muted",
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-none bg-primary transition-[width] duration-200 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export { Progress };
