"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * Solarium v9 Progress — two sizes:
 *
 * **default (14px):** `.prog-track` + `.prog-fill` with shimmer overlay +
 * inner 3D highlight.  Uses `.pf-primary`, `.pf-xp`, `.pf-success` fill
 * variants.
 *
 * **thin (4px):** `.prog-thin-track` + `.prog-thin-fill` with shimmer.
 * Intended for sidebar / dashboard XP bars.
 *
 * Optional `label` + `valueLabel` render a header row above the bar
 * (font-display 700 14px left, font-mono 12px primary right).
 */

type FillVariant = "primary" | "xp" | "success";
type SizeVariant = "default" | "thin";

interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  variant?: FillVariant;
  size?: SizeVariant;
  /** Left-aligned header label (display font, 700, 14px) */
  label?: string;
  /** Right-aligned header value (mono font, 12px, primary) */
  valueLabel?: string;
}

const FILL_CLASS: Record<SizeVariant, Record<FillVariant, string>> = {
  default: {
    primary: "prog-fill pf-primary",
    xp: "prog-fill pf-xp",
    success: "prog-fill pf-success",
  },
  thin: {
    primary: "prog-thin-fill pf-primary",
    xp: "prog-thin-fill pf-xp",
    success: "prog-thin-fill pf-success",
  },
};

const TRACK_CLASS: Record<SizeVariant, string> = {
  default: "prog-track",
  thin: "prog-thin-track",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(
  (
    {
      className,
      value,
      variant = "primary",
      size = "default",
      label,
      valueLabel,
      ...props
    },
    ref
  ) => {
    const hasHeader = label || valueLabel;

    return (
      <div className={cn(hasHeader && "prog-wrap", className)}>
        {hasHeader && (
          <div className="prog-header">
            {label && <span className="prog-label">{label}</span>}
            {valueLabel && <span className="prog-val">{valueLabel}</span>}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={TRACK_CLASS[size]}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={FILL_CLASS[size][variant]}
            style={{ width: `${value ?? 0}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
export type { ProgressProps, FillVariant, SizeVariant };
