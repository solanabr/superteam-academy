import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Semantic badge tones, on-token (`tailwind.config.ts`). Deliberately narrow so
 * "which red?" has one answer per meaning:
 *  - `danger`  — blocking / destructive (immutable mismatch, CI failing)
 *  - `warning` — transient / attention (content drift, CI pending, fetch retry)
 *  - `success` — healthy / passing
 *  - `info`    — informational (undecodable, in-progress checks)
 *  - `accent`  — a distinct non-red drift call-out (out-of-sync)
 *  - `neutral` — inert (draft, unknown)
 */
const BADGE_TONES = {
  success: "border-success bg-success-light text-success",
  danger: "border-danger bg-danger-light text-danger",
  warning: "border-streak bg-streak-light text-streak",
  info: "border-primary bg-primary-bg text-primary-dark dark:text-primary",
  accent: "border-accent bg-accent-bg text-accent-dark dark:text-accent",
  neutral: "border-border bg-subtle text-text-3",
} as const;

export type AdminBadgeTone = keyof typeof BADGE_TONES;

interface AdminBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color. Omit and pass `className` when a bespoke palette is needed. */
  tone?: AdminBadgeTone;
  /** `square` (default) for status chips, `pill` for CI-state chips. */
  shape?: "square" | "pill";
}

/**
 * The shared badge chrome — `inline-flex items-center border px-2 py-0.5 text-xs
 * font-medium` — plus an optional semantic `tone`. Consumers with a one-off
 * palette (the multi-state on-chain `StatusBadge`) pass `className`; consumers
 * with a semantic meaning pass `tone`. WS-C/WS-B reuse this for their read-only
 * state chips.
 */
export function AdminBadge({
  tone,
  shape = "square",
  className,
  children,
  ...rest
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-xs font-medium",
        shape === "pill" ? "rounded-full" : "rounded",
        tone && BADGE_TONES[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
